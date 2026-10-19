-- DISPOSABLE PROTOTYPE ONLY. This is not a connected migration.
-- BEGIN NATIVE SAFETY GUARD
do $local$ begin
  if current_database()<>'ks_disposable_handoff_test' then
    raise exception 'disposable_handoff_database_required';
  end if;
end $local$;
-- END NATIVE SAFETY GUARD
begin;

create table public.ks_proto_execution_approvals (
 approval_id uuid primary key, claim_id uuid not null references public.ks_setup_review_claims(claim_id),
 attempt_id uuid not null references public.ks_preview_provisioning_attempts(attempt_id),
 user_id uuid not null, approver_id uuid not null references public.profiles(id),
 operation text not null check(operation='new_line'), environment text not null check(environment='preview'),
 checkout_session_id text not null, payment_intent_id text not null, reseller_id text not null,
 package_id text not null, package_fingerprint text not null, binding_hash text not null,
 package_months integer not null, connections integer not null, bouquets integer[] not null,
 cost_units bigint not null check(cost_units between 1 and 1000000000000),
 balance_units bigint not null check(balance_units between 1 and 1000000000000),
 evidence_at timestamptz not null, expires_at timestamptz not null,
 approval_hash text not null unique check(approval_hash ~ '^[a-f0-9]{64}$')
);
create table public.ks_proto_reservation_handoffs (
 claim_id uuid primary key references public.ks_setup_review_claims(claim_id),
 attempt_id uuid not null unique references public.ks_preview_provisioning_attempts(attempt_id),
 approval_id uuid not null unique references public.ks_proto_execution_approvals(approval_id),
 user_id uuid not null, reseller_id text not null, utc_day date not null,
 cost_units bigint not null, balance_units bigint not null,
 before_reserved bigint not null, before_spent bigint not null,
 handed_off_at timestamptz not null default clock_timestamp()
);
alter table public.ks_proto_execution_approvals enable row level security;
alter table public.ks_proto_reservation_handoffs enable row level security;
revoke all on public.ks_proto_execution_approvals,public.ks_proto_reservation_handoffs from public,anon,authenticated,service_role;
grant select,insert on public.ks_proto_execution_approvals,public.ks_proto_reservation_handoffs to service_role;
-- Row locking needs one UPDATE privilege; existing immutable-slot triggers
-- continue to reject all actual updates, including same-value updates.
grant update(reserved_at) on public.ks_setup_review_reseller_slots to service_role;

create function public.ks_proto_lock_order(p_claim uuid,p_attempt uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare c public.ks_setup_review_claims%rowtype;
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'proto_read_committed_required'; end if;
 select * into strict c from public.ks_setup_review_claims where claim_id=p_claim;
 perform 1 from public.profiles where id=c.user_id for update;
 perform 1 from public.ks_payment_receipts where checkout_session_id=c.checkout_session_id for update;
 perform 1 from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id for update;
 perform 1 from public.ks_setup_review_claims where claim_id=p_claim for update;
 perform 1 from public.ks_preview_provisioning_attempts where attempt_id=p_attempt for update;
 perform 1 from public.ks_setup_review_policies where policy_id=c.policy_id for share;
end; $$;

create function public.ks_proto_canonical_binding(p_claim uuid) returns text
language sql stable security invoker set search_path='' as $$
 select encode(extensions.digest(
  '{"sessionId":'||to_json(r.checkout_session_id)::text||',"ownerId":'||to_json(c.user_id::text)::text
  ||',"intentId":'||to_json(c.payment_intent_id)::text||',"tier":'||to_json(r.tier)::text
  ||',"connections":'||r.connections::text||',"amountCents":'||r.amount_cents::text
  ||',"resellerId":'||to_json(c.reseller_id)::text||',"packageFingerprint":'||to_json(c.package_fingerprint)::text||'}','sha256'),'hex')
 from public.ks_setup_review_claims c join public.ks_payment_receipts r using(checkout_session_id) where c.claim_id=p_claim
$$;

create function public.ks_proto_validate_approval(p public.ks_proto_execution_approvals) returns void
language plpgsql volatile security invoker set search_path='' as $$
declare c public.ks_setup_review_claims%rowtype; a public.ks_preview_provisioning_attempts%rowtype;
 r public.ks_payment_receipts%rowtype; q public.ks_setup_order_queue%rowtype; pol public.ks_setup_review_policies%rowtype;
begin
 select * into strict c from public.ks_setup_review_claims where claim_id=p.claim_id;
 select * into strict a from public.ks_preview_provisioning_attempts where attempt_id=p.attempt_id;
 select * into strict r from public.ks_payment_receipts where checkout_session_id=c.checkout_session_id;
 select * into strict q from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id;
 select * into strict pol from public.ks_setup_review_policies where policy_id=c.policy_id;
 if (p.user_id,p.checkout_session_id,p.payment_intent_id,p.reseller_id,p.package_id,p.package_fingerprint,p.cost_units)
  is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id,c.package_fingerprint,c.cost_units)
  or p.operation<>'new_line' or p.environment<>'preview' or c.environment<>'preview'
  or (a.user_id,a.checkout_session_id,a.payment_intent_id,a.reseller_id,a.package_id,a.connections)
   is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id,r.connections)
  or a.state<>'reserved' or a.created_at<c.reserved_at
  or a.binding_hash is distinct from public.ks_proto_canonical_binding(c.claim_id)
  or p.binding_hash is distinct from a.binding_hash
  or p.package_months is distinct from a.package_months or p.connections is distinct from a.connections
  or p.bouquets is distinct from a.bouquet_ids or a.expected_credits*1000000<>p.cost_units
  or r.livemode or r.activated or r.expires_at is not null
  or q.fulfillment_status<>'awaiting_activation'
  or not exists(select 1 from public.ks_setup_purchase_intents i where i.checkout_session_id=c.checkout_session_id
   and i.user_id=c.user_id and i.kind='new_service' and i.new_service_attested and i.source='authenticated_checkout')
 then raise exception 'proto_approval_binding_required'; end if;
 if pol.revoked_at is not null or pol.starts_at>clock_timestamp() or pol.expires_at<=clock_timestamp()
  or pol.mode<>'review-only' or (pol.policy_hash,pol.reseller_id,pol.environment) is distinct from (c.policy_hash,c.reseller_id,c.environment)
  or c.utc_day<>(clock_timestamp() at time zone 'UTC')::date
  or not exists(select 1 from public.ks_setup_review_packages k where k.policy_id=c.policy_id and k.tier=r.tier
   and k.connections=r.connections and k.package_id=c.package_id and k.package_fingerprint=c.package_fingerprint
   and k.max_cost_units>=c.cost_units) or pol.per_order_units<c.cost_units
 then raise exception 'proto_current_policy_required'; end if;
 if p.evidence_at>clock_timestamp() or p.evidence_at<clock_timestamp()-interval '30 seconds'
  or p.expires_at<=clock_timestamp() or p.expires_at>clock_timestamp()+interval '2 minutes'
  or p.balance_units<p.cost_units
 then raise exception 'proto_fresh_approval_required'; end if;
 if not exists(select 1 from public.ks_setup_review_reseller_slots where claim_id=c.claim_id and reseller_id=c.reseller_id)
  or exists(select 1 from public.ks_preview_reseller_dispatches where reseller_id=c.reseller_id)
  or exists(select 1 from public.ks_preview_provisioning_attempts x where x.reseller_id=c.reseller_id
    and x.attempt_id<>a.attempt_id and x.state in ('reserved','dispatching','provider_verified','reconciliation_required'))
 then raise exception 'proto_exclusive_source_required'; end if;
 perform public.ks_assert_preview_new_customer(c.user_id);
end; $$;

create function public.ks_proto_guard_approval() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op<>'INSERT' then raise exception 'proto_evidence_is_immutable'; end if;
 perform public.ks_proto_lock_order(new.claim_id,new.attempt_id);
 perform public.ks_proto_validate_approval(new);
 return new;
end; $$;
create trigger ks_proto_guard_approval before insert or update or delete on public.ks_proto_execution_approvals
 for each row execute function public.ks_proto_guard_approval();

create function public.ks_proto_guard_handoff() returns trigger
language plpgsql security invoker set search_path='' as $$
declare p public.ks_proto_execution_approvals%rowtype; c public.ks_setup_review_claims%rowtype;
 b public.ks_setup_review_budgets%rowtype; pol public.ks_setup_review_policies%rowtype;
begin
 if tg_op<>'INSERT' then raise exception 'proto_evidence_is_immutable'; end if;
 select * into strict p from public.ks_proto_execution_approvals where approval_id=new.approval_id;
 if (new.claim_id,new.attempt_id,new.user_id,new.reseller_id,new.cost_units,new.balance_units)
  is distinct from (p.claim_id,p.attempt_id,p.user_id,p.reseller_id,p.cost_units,p.balance_units)
 then raise exception 'proto_handoff_binding_required'; end if;
 perform public.ks_proto_lock_order(new.claim_id,new.attempt_id);
 if not pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||new.reseller_id,0))
 then raise exception 'reseller_reservation_busy'; end if;
 perform public.ks_proto_validate_approval(p);
 select * into strict c from public.ks_setup_review_claims where claim_id=new.claim_id;
 perform 1 from public.ks_setup_review_reseller_slots where claim_id=c.claim_id for update;
 select * into strict b from public.ks_setup_review_budgets where reseller_id=c.reseller_id and utc_day=c.utc_day for update;
 select * into strict pol from public.ks_setup_review_policies where policy_id=c.policy_id;
 if new.utc_day<>c.utc_day or (new.before_reserved,new.before_spent) is distinct from (b.reserved_units,b.spent_units)
  or b.reserved_units<c.cost_units or b.spent_units+b.reserved_units>least(b.daily_limit_units,pol.daily_limit_units)
  or p.balance_units<b.reserved_units+pol.min_reserve_units
 then raise exception 'proto_reserved_budget_required'; end if;
 new.handed_off_at:=clock_timestamp();
 return new;
end; $$;
create trigger ks_proto_guard_handoff before insert or update or delete on public.ks_proto_reservation_handoffs
 for each row execute function public.ks_proto_guard_handoff();

-- The caller is a simulated trusted service. This records fictional approval
-- evidence; it does not authenticate an administrator or enable any send path.
create function public.ks_proto_capture_approval(p_id uuid,p_claim uuid,p_attempt uuid,p_approver uuid,
 p_hash text,p_balance bigint,p_evidence timestamptz,p_expiry timestamptz,p_operation text default 'new_line')
returns uuid language plpgsql security invoker set search_path='' as $$
begin
 insert into public.ks_proto_execution_approvals
 select p_id,c.claim_id,a.attempt_id,c.user_id,p_approver,p_operation,'preview',c.checkout_session_id,
  c.payment_intent_id,c.reseller_id,c.package_id,c.package_fingerprint,a.binding_hash,a.package_months,
  a.connections,a.bouquet_ids,c.cost_units,p_balance,p_evidence,p_expiry,p_hash
 from public.ks_setup_review_claims c join public.ks_preview_provisioning_attempts a on a.attempt_id=p_attempt
 where c.claim_id=p_claim;
 if not found then raise exception 'proto_claim_attempt_required'; end if;
 return p_id;
end; $$;

create function public.ks_proto_transfer(p_approval uuid,p_token uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare p public.ks_proto_execution_approvals%rowtype; h public.ks_proto_reservation_handoffs%rowtype;
 c public.ks_setup_review_claims%rowtype; a public.ks_preview_provisioning_attempts%rowtype;
 b public.ks_setup_review_budgets%rowtype;
begin
 select * into strict p from public.ks_proto_execution_approvals where approval_id=p_approval;
 perform public.ks_proto_lock_order(p.claim_id,p.attempt_id);
 select * into strict a from public.ks_preview_provisioning_attempts where attempt_id=p.attempt_id;
 if a.claim_token is distinct from p_token then raise exception 'proto_attempt_token_required'; end if;
 select * into h from public.ks_proto_reservation_handoffs where claim_id=p.claim_id;
 if found then
  if (h.attempt_id,h.approval_id) is distinct from (p.attempt_id,p_approval) then raise exception 'proto_replay_binding_changed'; end if;
  return jsonb_build_object('replayed',true,'would_dispatch',false,'may_dispatch',false,'state',a.state);
 end if;
 if not pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||p.reseller_id,0))
 then raise exception 'reseller_reservation_busy'; end if;
 perform public.ks_proto_validate_approval(p);
 select * into strict c from public.ks_setup_review_claims where claim_id=p.claim_id;
 perform 1 from public.ks_setup_review_reseller_slots where claim_id=c.claim_id for update;
 select * into strict b from public.ks_setup_review_budgets where reseller_id=c.reseller_id and utc_day=c.utc_day for update;
 insert into public.ks_proto_reservation_handoffs(claim_id,attempt_id,approval_id,user_id,reseller_id,utc_day,
  cost_units,balance_units,before_reserved,before_spent)
 values(c.claim_id,a.attempt_id,p.approval_id,c.user_id,c.reseller_id,c.utc_day,c.cost_units,p.balance_units,b.reserved_units,b.spent_units);
 delete from public.ks_setup_review_reseller_slots where claim_id=c.claim_id and reseller_id=c.reseller_id;
 if not public.ks_begin_approved_preview_provisioning(a.attempt_id,p_token,p.approver_id,p.approval_hash,
  p.expires_at,p.cost_units,p.balance_units) then raise exception 'proto_dispatch_not_claimed'; end if;
 return jsonb_build_object('replayed',false,'would_dispatch',true,'may_dispatch',false,'state','dispatching');
end; $$;

create function public.ks_proto_assert_handoff(p_claim uuid) returns void
language plpgsql volatile security invoker set search_path='' as $$
declare h public.ks_proto_reservation_handoffs%rowtype; p public.ks_proto_execution_approvals%rowtype;
 a public.ks_preview_provisioning_attempts%rowtype; c public.ks_setup_review_claims%rowtype;
 s public.ks_setup_review_completions%rowtype; b public.ks_setup_review_budgets%rowtype;
begin
 select * into h from public.ks_proto_reservation_handoffs where claim_id=p_claim;
 if not found then return; end if;
 select * into strict p from public.ks_proto_execution_approvals where approval_id=h.approval_id;
 select * into strict a from public.ks_preview_provisioning_attempts where attempt_id=h.attempt_id;
 select * into strict c from public.ks_setup_review_claims where claim_id=h.claim_id;
 select * into strict b from public.ks_setup_review_budgets where reseller_id=h.reseller_id and utc_day=h.utc_day;
 if (h.attempt_id,h.user_id,h.reseller_id,h.cost_units,h.balance_units) is distinct from
    (p.attempt_id,p.user_id,p.reseller_id,p.cost_units,p.balance_units)
  or (a.user_id,a.checkout_session_id,a.payment_intent_id,a.reseller_id,a.package_id)
   is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id)
  or a.binding_hash<>p.binding_hash or a.expected_credits*1000000<>h.cost_units
  or exists(select 1 from public.ks_setup_review_reseller_slots where claim_id=h.claim_id)
 then raise exception 'proto_handoff_transaction_incomplete'; end if;
 select * into s from public.ks_setup_review_completions where claim_id=h.claim_id;
 if a.state in ('dispatching','provider_verified','reconciliation_required') then
  if s.claim_id is not null or b.reserved_units<>h.before_reserved or b.spent_units<>h.before_spent
   or exists(select 1 from public.ks_preview_paid_fulfillments where attempt_id=h.attempt_id)
   or not exists(select 1 from public.ks_preview_reseller_dispatches d where d.attempt_id=h.attempt_id
    and (d.reseller_id,d.approver_id,d.approval_hash,d.approval_expires_at,d.credit_cost_units,d.balance_units)
     =(h.reseller_id,p.approver_id,p.approval_hash,p.expires_at,h.cost_units::numeric,h.balance_units::numeric))
  then raise exception 'proto_handoff_transaction_incomplete'; end if;
 elsif a.state='credentials_ready' then
  if s.claim_id is null or s.attempt_id<>h.attempt_id or (s.user_id,s.checkout_session_id,s.reseller_id,s.utc_day,s.cost_units)
   is distinct from (h.user_id,c.checkout_session_id,h.reseller_id,h.utc_day,h.cost_units)
   or (s.before_spent,s.before_reserved,s.after_spent,s.after_reserved)
    is distinct from (h.before_spent,h.before_reserved,h.before_spent+h.cost_units,h.before_reserved-h.cost_units)
   or b.spent_units<s.after_spent
   or exists(select 1 from public.ks_preview_reseller_dispatches where attempt_id=h.attempt_id)
   or not exists(select 1 from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id and fulfillment_status='setup_complete')
   or not exists(select 1 from public.ks_preview_paid_orders where checkout_session_id=c.checkout_session_id and fulfillment_status='setup_complete')
   or not exists(select 1 from public.ks_preview_streaming_logins where attempt_id=h.attempt_id and user_id=h.user_id)
   or not exists(select 1 from public.ks_preview_paid_fulfillments f join public.iptv_customers crm on crm.id=f.crm_customer_id
     where f.attempt_id=h.attempt_id and f.user_id=h.user_id and f.checkout_session_id=c.checkout_session_id
      and f.credit_cost_units=h.cost_units and f.balance_before_units=h.balance_units
      and f.approval_hash=p.approval_hash and f.approver_id=p.approver_id
      and crm.source='roomba_preview_paid' and crm.username is not null
      and encode(extensions.digest(crm.username,'sha256'),'hex')=a.username_hash
      and crm.external_id=a.provider_line_id::bigint and crm.expiration_at=a.provider_expires_at
      and crm.connections_allowed=a.connections and crm.trial=false)
  then raise exception 'proto_review_settlement_required'; end if;
 else raise exception 'proto_handoff_transaction_incomplete';
 end if;
end; $$;

create function public.ks_proto_deferred_check() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target jsonb; cid uuid; rid text; day date;
begin
 target:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 if tg_table_name='ks_proto_reservation_handoffs' then
  -- Initial transfer may not commit a stale approval. Later provider/completion
  -- writes deliberately do not require an unexpired approval or current policy.
  if not exists(select 1 from public.ks_proto_execution_approvals p
    join public.ks_setup_review_claims c on c.claim_id=p.claim_id
    join public.ks_setup_review_policies pol on pol.policy_id=c.policy_id
    where p.approval_id=(target->>'approval_id')::uuid
    and p.expires_at>clock_timestamp() and p.evidence_at>=clock_timestamp()-interval '30 seconds'
    and c.utc_day=(clock_timestamp() at time zone 'UTC')::date
    and pol.revoked_at is null and pol.starts_at<=clock_timestamp() and pol.expires_at>clock_timestamp())
  then raise exception 'proto_fresh_approval_required'; end if;
 end if;
 if tg_table_name='ks_setup_review_budgets' then
  rid:=target->>'reseller_id'; day:=(target->>'utc_day')::date;
  for cid in select claim_id from public.ks_proto_reservation_handoffs where reseller_id=rid and utc_day=day loop
   perform public.ks_proto_assert_handoff(cid);
  end loop;
 elsif target ? 'claim_id' then
  perform public.ks_proto_assert_handoff((target->>'claim_id')::uuid);
 elsif target ? 'attempt_id' then
  for cid in select claim_id from public.ks_proto_reservation_handoffs where attempt_id=(target->>'attempt_id')::uuid loop
   perform public.ks_proto_assert_handoff(cid);
  end loop;
 elsif target ? 'checkout_session_id' then
  for cid in select h.claim_id from public.ks_proto_reservation_handoffs h join public.ks_setup_review_claims c using(claim_id)
    where c.checkout_session_id=target->>'checkout_session_id' loop perform public.ks_proto_assert_handoff(cid); end loop;
 end if;
 return null;
end; $$;

create constraint trigger ks_proto_transaction_complete after insert on public.ks_proto_reservation_handoffs
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_attempt_complete after insert or update or delete on public.ks_preview_provisioning_attempts
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_dispatch_complete after insert or update or delete on public.ks_preview_reseller_dispatches
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_review_slot_complete after insert or update or delete on public.ks_setup_review_reseller_slots
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_fulfillment_complete after insert or update or delete on public.ks_preview_paid_fulfillments
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_login_complete after insert or update or delete on public.ks_preview_streaming_logins
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_budget_complete after insert or update or delete on public.ks_setup_review_budgets
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_review_complete after insert or update or delete on public.ks_setup_review_completions
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_setup_queue_complete after insert or update or delete on public.ks_setup_order_queue
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();
create constraint trigger ks_proto_preview_queue_complete after insert or update or delete on public.ks_preview_paid_orders
 deferrable initially deferred for each row execute function public.ks_proto_deferred_check();

create function public.ks_proto_complete(p_claim uuid,p_attempt uuid,p_token uuid,p_username text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c public.ks_setup_review_claims%rowtype;
begin
 perform public.ks_proto_lock_order(p_claim,p_attempt);
 select * into strict c from public.ks_setup_review_claims where claim_id=p_claim;
 if not exists(select 1 from public.ks_proto_reservation_handoffs where claim_id=p_claim and attempt_id=p_attempt)
 then raise exception 'proto_handoff_required'; end if;
 if not pg_try_advisory_xact_lock(hashtextextended('ks-reseller-reservation/v1:'||c.reseller_id,0))
 then raise exception 'reseller_reservation_busy'; end if;
 return public.ks_complete_reviewed_preview_setup(p_claim,p_attempt,p_token,c.user_id,p_username);
end; $$;

revoke all on function public.ks_proto_lock_order(uuid,uuid),public.ks_proto_canonical_binding(uuid),
 public.ks_proto_validate_approval(public.ks_proto_execution_approvals),public.ks_proto_guard_approval(),public.ks_proto_guard_handoff(),
 public.ks_proto_capture_approval(uuid,uuid,uuid,uuid,text,bigint,timestamptz,timestamptz,text),
 public.ks_proto_transfer(uuid,uuid),public.ks_proto_assert_handoff(uuid),public.ks_proto_deferred_check(),
 public.ks_proto_complete(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.ks_proto_lock_order(uuid,uuid),public.ks_proto_canonical_binding(uuid),
 public.ks_proto_validate_approval(public.ks_proto_execution_approvals),public.ks_proto_guard_approval(),public.ks_proto_guard_handoff(),
 public.ks_proto_capture_approval(uuid,uuid,uuid,uuid,text,bigint,timestamptz,timestamptz,text),
 public.ks_proto_transfer(uuid,uuid),public.ks_proto_assert_handoff(uuid),public.ks_proto_deferred_check(),
 public.ks_proto_complete(uuid,uuid,uuid,text) to service_role;
-- Modified existing guards are appended before COMMIT by the build script.

create or replace function public.ks_guard_setup_review_history()
returns trigger language plpgsql security invoker set search_path='' as $history$
begin
  if tg_op='DELETE' then
    if tg_table_name='ks_setup_review_reseller_slots' and exists(
      select 1 from public.ks_proto_reservation_handoffs h
      join public.ks_proto_execution_approvals p using(approval_id)
      join public.ks_preview_provisioning_attempts a on a.attempt_id=h.attempt_id
      where h.claim_id=old.claim_id and h.reseller_id=old.reseller_id
        and a.state='reserved' and p.expires_at>clock_timestamp()) then return old; end if;
    if tg_table_name='ks_setup_review_reseller_slots' and exists(
      select 1 from public.ks_setup_review_completions s
      join public.ks_setup_review_budgets b on b.reseller_id=s.reseller_id and b.utc_day=s.utc_day
      join public.ks_setup_order_queue q on q.checkout_session_id=s.checkout_session_id
      where s.claim_id=old.claim_id and s.reseller_id=old.reseller_id
        and b.spent_units=s.after_spent and b.reserved_units=s.after_reserved
        and q.fulfillment_status='setup_complete') then return old; end if;
    raise exception 'setup_review_history_cannot_be_deleted';
  end if;
  if tg_table_name='ks_setup_review_policies' then
    if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at')
      or old.revoked_at is not null or new.revoked_at is null then raise exception 'setup_review_policy_is_immutable'; end if;
  elsif tg_table_name='ks_setup_review_budgets' then
    if (to_jsonb(new)-array['reserved_units','spent_units']) is distinct from (to_jsonb(old)-array['reserved_units','spent_units']) then
      raise exception 'setup_review_budget_cannot_be_reset';
    end if;
    if new.spent_units=old.spent_units and new.reserved_units>=old.reserved_units then return new; end if;
    if not exists(select 1 from public.ks_setup_review_completions s
      join public.ks_setup_order_queue q using(checkout_session_id)
      where s.reseller_id=old.reseller_id and s.utc_day=old.utc_day
        and (s.before_spent,s.before_reserved,s.after_spent,s.after_reserved)
          =(old.spent_units,old.reserved_units,new.spent_units,new.reserved_units)
        and q.fulfillment_status='setup_complete') then raise exception 'verified_review_settlement_required'; end if;
  else raise exception 'setup_review_binding_is_immutable';
  end if;
  return new;
end;
$history$;


create or replace function public.ks_guard_reviewed_preview_completion()
returns trigger language plpgsql security invoker set search_path='' as $guard$
declare
  c public.ks_setup_review_claims%rowtype;
  a public.ks_preview_provisioning_attempts%rowtype;
  r public.ks_payment_receipts%rowtype;
  q public.ks_setup_order_queue%rowtype;
  f public.ks_preview_paid_fulfillments%rowtype;
  b public.ks_setup_review_budgets%rowtype;
  expected_binding text;
begin
  if tg_op<>'INSERT' then raise exception 'review_completion_is_immutable'; end if;
  select * into c from public.ks_setup_review_claims where claim_id=new.claim_id;
  if not found then raise exception 'review_claim_required'; end if;
  -- Same profile -> receipt -> queue -> claim -> budget order as the wrapper.
  perform 1 from public.profiles where id=c.user_id for update;
  select * into r from public.ks_payment_receipts where checkout_session_id=c.checkout_session_id for update;
  select * into q from public.ks_setup_order_queue where checkout_session_id=c.checkout_session_id for update;
  perform 1 from public.ks_setup_review_claims where claim_id=c.claim_id for update;
  select * into a from public.ks_preview_provisioning_attempts where attempt_id=new.attempt_id;
  select * into f from public.ks_preview_paid_fulfillments where attempt_id=new.attempt_id;
  -- Match the established server JSON binding byte-for-byte. jsonb::text would
  -- reorder keys/add spaces and must not replace this canonical encoding.
  expected_binding:=encode(extensions.digest(
    '{"sessionId":'||to_json(r.checkout_session_id)::text||',"ownerId":'||to_json(c.user_id::text)::text
    ||',"intentId":'||to_json(c.payment_intent_id)::text||',"tier":'||to_json(r.tier)::text
    ||',"connections":'||r.connections::text||',"amountCents":'||r.amount_cents::text
    ||',"resellerId":'||to_json(c.reseller_id)::text||',"packageFingerprint":'||to_json(c.package_fingerprint)::text||'}','sha256'),'hex');
  if c.environment is distinct from 'preview' or c.state is distinct from 'reserved_for_review'
    or r.livemode is distinct from false or r.activated is distinct from false or r.expires_at is not null
    or q.fulfillment_status is distinct from 'awaiting_activation'
    or (r.user_id,r.payment_intent_id,r.checkout_session_id) is distinct from (c.user_id,c.payment_intent_id,c.checkout_session_id)
    or (new.user_id,new.checkout_session_id,new.reseller_id,new.utc_day,new.cost_units)
       is distinct from (c.user_id,c.checkout_session_id,c.reseller_id,c.utc_day,c.cost_units)
    or a.attempt_id is null or a.state is distinct from 'credentials_ready'
    or a.binding_hash is distinct from expected_binding
    or a.package_months is distinct from (case r.tier when 'bronze' then 1 when 'silver' then 3 when 'gold' then 6 when 'platinum' then 12 end)
    or (a.user_id,a.checkout_session_id,a.payment_intent_id,a.reseller_id,a.package_id,a.connections)
       is distinct from (c.user_id,c.checkout_session_id,c.payment_intent_id,c.reseller_id,c.package_id,r.connections)
    or a.expected_credits*1000000 is distinct from c.cost_units::numeric
    or a.created_at<c.reserved_at or a.provider_line_id is null or a.provider_expires_at<=clock_timestamp()
    or f.attempt_id is null or (f.user_id,f.checkout_session_id) is distinct from (c.user_id,c.checkout_session_id)
    or f.credit_cost_units is distinct from c.cost_units::numeric
    or f.balance_before_units is distinct from coalesce((select h.balance_units
      from public.ks_proto_reservation_handoffs h where h.claim_id=c.claim_id and h.attempt_id=a.attempt_id),c.balance_units)::numeric
    or f.approved_at<c.reserved_at
    or not exists(select 1 from public.ks_preview_streaming_logins l
      where l.attempt_id=a.attempt_id and l.user_id=c.user_id and l.checkout_session_id=c.checkout_session_id)
    or not exists(select 1 from public.ks_preview_paid_orders p
      where p.checkout_session_id=c.checkout_session_id and p.fulfillment_status='setup_complete')
    or not exists(select 1 from public.iptv_customers customer
      where customer.id=f.crm_customer_id and customer.source='roomba_preview_paid'
      and customer.external_id=a.provider_line_id::bigint and customer.connections_allowed=a.connections
      and customer.expiration_at=a.provider_expires_at and customer.trial=false)
    or (not exists(select 1 from public.ks_setup_review_reseller_slots s where s.claim_id=c.claim_id and s.reseller_id=c.reseller_id)
      and not exists(select 1 from public.ks_proto_reservation_handoffs h where h.claim_id=c.claim_id
        and h.attempt_id=a.attempt_id and h.user_id=c.user_id and h.reseller_id=c.reseller_id
        and h.cost_units=c.cost_units and h.utc_day=c.utc_day))
    then raise exception 'separately_verified_preview_completion_required'; end if;
  select * into b from public.ks_setup_review_budgets where reseller_id=c.reseller_id and utc_day=c.utc_day for update;
  if not found or b.reserved_units<c.cost_units
    or (new.before_spent,new.before_reserved,new.after_spent,new.after_reserved)
       is distinct from (b.spent_units,b.reserved_units,b.spent_units+c.cost_units,b.reserved_units-c.cost_units)
    then raise exception 'review_completion_budget_mismatch'; end if;
  new.completed_at:=clock_timestamp();
  return new;
end;
$guard$;

commit;
