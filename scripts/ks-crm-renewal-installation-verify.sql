-- Read-only post-install verification. Run only against project
-- wftfxerblhlsxiijtfbo after the reviewed installation transaction commits.
select
  (select count(*)=1 and bool_and(not execution_enabled)
    from public.ks_crm_renewal_control) as execution_disabled,
  not has_table_privilege('service_role','public.ks_crm_renewal_control','insert,update,delete')
    as service_cannot_enable_execution,
  (select count(*)=6 and bool_and(c.relrowsecurity)
    and not bool_or(has_table_privilege('anon',c.oid,'select,insert,update,delete')
      or has_table_privilege('authenticated',c.oid,'select,insert,update,delete'))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and c.relname in
      ('ks_crm_renewal_control','ks_crm_renewal_approvals','ks_crm_renewal_operations',
       'ks_crm_renewal_line_versions','ks_crm_renewal_reseller_slots','ks_crm_renewal_completions'))
    as private_rls_tables,
  (select count(*)=9 and bool_and(not p.prosecdef and p.proconfig @> array['search_path=""'])
    and not bool_or(has_function_privilege('anon',p.oid,'execute')
      or has_function_privilege('authenticated',p.oid,'execute'))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'ks_crm_%renewal%')
    as private_invoker_functions,
  (select count(*)=3 from pg_trigger
    where tgfoid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
      and tgrelid in ('public.ks_preview_reseller_dispatches'::regclass,
        'public.ks_setup_review_reseller_slots'::regclass,'public.ks_crm_renewal_reseller_slots'::regclass)
      and not tgisinternal and tgenabled='O' and tgtype=23) as shared_exclusion_attached,
  (not exists(select 1 from public.ks_crm_renewal_approvals)
    and not exists(select 1 from public.ks_crm_renewal_operations)
    and not exists(select 1 from public.ks_crm_renewal_line_versions)
    and not exists(select 1 from public.ks_crm_renewal_reseller_slots)
    and not exists(select 1 from public.ks_crm_renewal_completions)) as no_new_work;
