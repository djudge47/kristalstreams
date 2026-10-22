-- SELECT-only verification for active project wftfxerblhlsxiijtfbo.
select
  (select count(*)=1 and bool_and(not execution_enabled)
    from public.ks_crm_live_renewal_control) as live_execution_disabled,
  (select count(*)=1 and bool_and(not execution_enabled)
    from public.ks_crm_renewal_control) as test_execution_disabled,
  not has_table_privilege('service_role','public.ks_crm_live_renewal_control','insert,update,delete')
    as service_cannot_enable_execution,
  (select count(*)=6 and bool_and(c.relrowsecurity)
    and not bool_or(has_table_privilege('anon',c.oid,'select,insert,update,delete')
      or has_table_privilege('authenticated',c.oid,'select,insert,update,delete'))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and c.relname in
      ('ks_crm_live_renewal_control','ks_crm_live_renewal_approvals','ks_crm_live_renewal_operations',
       'ks_crm_live_renewal_line_versions','ks_crm_live_renewal_reseller_slots','ks_crm_live_renewal_completions'))
    as private_rls_tables,
  (select count(*)=10 and bool_and(not p.prosecdef and p.proconfig @> array['search_path=""']
      and has_function_privilege('service_role',p.oid,'execute'))
    and not bool_or(has_function_privilege('anon',p.oid,'execute')
      or has_function_privilege('authenticated',p.oid,'execute'))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'ks_crm_live_%renewal%')
    as private_invoker_functions,
  (select count(*)=4 from pg_trigger
    where tgfoid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
      and tgrelid in ('public.ks_preview_reseller_dispatches'::regclass,
        'public.ks_setup_review_reseller_slots'::regclass,'public.ks_crm_renewal_reseller_slots'::regclass,
        'public.ks_crm_live_renewal_reseller_slots'::regclass)
      and not tgisinternal and tgenabled='O' and tgtype=23) as four_protocol_exclusion_attached,
  exists(select 1 from pg_proc where oid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
    and not prosecdef and provolatile='v' and proconfig @> array['search_path=""']
    and encode(sha256(convert_to(prosrc,'UTF8')),'hex')='55f892aca2d53b808135722a1be6e0cac8c4adbc8b5870b6663690d354ced088')
    as reviewed_shared_guard,
  (not exists(select 1 from public.ks_crm_live_renewal_approvals)
    and not exists(select 1 from public.ks_crm_live_renewal_operations)
    and not exists(select 1 from public.ks_crm_live_renewal_line_versions)
    and not exists(select 1 from public.ks_crm_live_renewal_reseller_slots)
    and not exists(select 1 from public.ks_crm_live_renewal_completions)) as no_live_work;
