-- All synthetic fixtures and entitlement changes are rolled back.
begin;
do $$
declare
  fresh_id uuid := gen_random_uuid();
  paid_id uuid := gen_random_uuid();
  legacy_id uuid := gen_random_uuid();
  t jsonb;
  again jsonb;
  e jsonb;
  before_expiry timestamptz;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,aud,role)
    values(fresh_id,'ks-trial-schema-'||fresh_id::text||'@example.invalid',now(),'{}','{}','authenticated','authenticated'),
      (paid_id,'ks-paid-schema-'||paid_id::text||'@example.invalid',now(),'{}','{}','authenticated','authenticated'),
      (legacy_id,'ks-legacy-schema-'||legacy_id::text||'@example.invalid',now(),'{}','{}','authenticated','authenticated');
  update public.profiles set subscription_tier='gold',subscription_status='active',connections_allowed=4 where id=paid_id;
  update public.profiles set subscription_tier='demo',subscription_status='inactive' where id=legacy_id;

  if has_table_privilege('anon','public.ks_trial_requests','SELECT')
    or has_table_privilege('authenticated','public.ks_trial_requests','INSERT')
    or has_table_privilege('authenticated','public.ks_trial_email_state','UPDATE')
    or has_function_privilege('authenticated','public.ks_request_trial(uuid,text,text,boolean)','EXECUTE')
    or has_function_privilege('anon','public.ks_prepare_trial_email(uuid,text)','EXECUTE') then
    raise exception 'FAIL: trial data or privileged functions are publicly accessible';
  end if;
  execute 'set local role service_role';
  t := public.ks_request_trial(fresh_id,'trial-owner@example.invalid','Trial Owner',false);
  if exists(select 1 from public.profiles where id=fresh_id and subscription_status='active') then
    raise exception 'FAIL: Preview activated a live profile';
  end if;
  again := public.ks_request_trial(fresh_id,'trial-owner@example.invalid','Changed Name',false);
  if again->>'id' <> t->>'id' or again->>'expires_at' <> t->>'expires_at' or not (again->>'already_requested')::boolean then
    raise exception 'FAIL: duplicate trial created or expiry changed';
  end if;
  e := public.ks_prepare_trial_email((t->>'id')::uuid,'support');
  if e->'send_payload'->'to' <> '["support@kristalstream.com"]'::jsonb or e->'send_payload'->>'subject' not like 'TEST%' then
    raise exception 'FAIL: Preview support email is misdirected or lacks a test marker';
  end if;
  again := public.ks_prepare_trial_email((t->>'id')::uuid,'support');
  if again->'send_payload' <> e->'send_payload' or again->>'idempotency_key' <> e->>'idempotency_key' then
    raise exception 'FAIL: retry payload or deduplication key changed';
  end if;
  e := public.ks_prepare_trial_email((t->>'id')::uuid,'customer');
  if e->'send_payload'->'to' <> '["trial-owner@example.invalid"]'::jsonb or e->'send_payload'->>'subject' not like 'TEST%' then
    raise exception 'FAIL: customer acknowledgment is misdirected or lacks a test marker';
  end if;

  t := public.ks_request_trial(fresh_id,'trial-owner@example.invalid','Trial Owner',true);
  if not exists(select 1 from public.profiles where id=fresh_id and subscription_tier='demo'
    and subscription_status='active' and connections_allowed=1 and subscription_expires_at=(t->>'expires_at')::timestamptz) then
    raise exception 'FAIL: live trial was not activated exactly once';
  end if;
  update public.ks_trial_requests set expires_at=now()-interval '1 hour' where id=(t->>'id')::uuid;
  select expires_at into before_expiry from public.ks_trial_requests where id=(t->>'id')::uuid;
  update public.profiles set subscription_expires_at=before_expiry where id=fresh_id;
  again := public.ks_request_trial(fresh_id,'trial-owner@example.invalid','Trial Owner',true);
  if (again->>'expires_at')::timestamptz <> before_expiry
    or (select subscription_expires_at from public.profiles where id=fresh_id) <> before_expiry then
    raise exception 'FAIL: expired trial was restarted';
  end if;
  begin
    perform public.ks_request_trial(paid_id,'paid@example.invalid',null,true);
    raise exception 'FAIL: paid account accepted a trial';
  exception when raise_exception then if sqlerrm <> 'paid_account' then raise; end if; end;
  if not exists(select 1 from public.profiles where id=paid_id and subscription_tier='gold' and connections_allowed=4) then
    raise exception 'FAIL: paid plan was changed';
  end if;
  begin
    perform public.ks_request_trial(legacy_id,'legacy@example.invalid',null,true);
    raise exception 'FAIL: legacy demo account received a second trial';
  exception when raise_exception then if sqlerrm <> 'trial_already_used' then raise; end if; end;
  execute 'reset role';
end;
$$;
rollback;
select 'PASS: private permissions, Preview isolation, idempotent requests, frozen email payloads, fixed recipients, live activation, expired-trial protection, paid-plan preservation and legacy-trial protection. All fixtures rolled back.' as result;
