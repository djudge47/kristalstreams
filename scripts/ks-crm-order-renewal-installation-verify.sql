-- Read-only verification for the disabled changed-order installation.
select
  (select count(*)=1 and bool_and(not execution_enabled) from public.ks_crm_order_renewal_control)
    and (select count(*)=1 and bool_and(not execution_enabled) from public.ks_crm_live_renewal_control)
    and (select count(*)=1 and bool_and(not execution_enabled) from public.ks_crm_renewal_control) as all_execution_off,
  not has_column_privilege('service_role','public.ks_crm_order_renewal_control','execution_enabled','update')
    and not has_table_privilege('service_role','public.ks_crm_order_renewal_control','insert')
    and not has_table_privilege('service_role','public.ks_crm_order_renewal_control','delete') as service_cannot_enable,
  (select count(*)=6 and bool_and(c.relrowsecurity
    and not has_table_privilege('anon',c.oid,'select,insert,update,delete')
    and not has_table_privilege('authenticated',c.oid,'select,insert,update,delete'))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and c.relname like 'ks_crm_order_renewal_%') as private_rls_tables,
  (select count(*)=10 and bool_and(not p.prosecdef and p.proconfig @> array['search_path=""']
    and not has_function_privilege('anon',p.oid,'execute')
    and not has_function_privilege('authenticated',p.oid,'execute'))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'ks_crm_order_%renewal%') as private_invoker_functions,
  (select encode(sha256(convert_to(prosrc,'UTF8')),'hex')='bcfe76ab1b25f2c41b302d6ef0f47f8209d7288f6ca20f4a1ef08804e965a884'
    from pg_proc where oid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure) as reviewed_five_protocol_guard,
  (select count(*)=5 from pg_trigger where tgfoid='public.ks_guard_reseller_reservation_exclusion()'::regprocedure
    and tgrelid in ('public.ks_preview_reseller_dispatches'::regclass,'public.ks_setup_review_reseller_slots'::regclass,
      'public.ks_crm_renewal_reseller_slots'::regclass,'public.ks_crm_live_renewal_reseller_slots'::regclass,
      'public.ks_crm_order_renewal_reseller_slots'::regclass)
    and not tgisinternal and tgenabled='O' and tgtype=23) as all_five_exclusions_attached,
  not exists(select 1 from public.ks_crm_order_renewal_approvals)
    and not exists(select 1 from public.ks_crm_order_renewal_operations)
    and not exists(select 1 from public.ks_crm_order_renewal_line_versions)
    and not exists(select 1 from public.ks_crm_order_renewal_reseller_slots)
    and not exists(select 1 from public.ks_crm_order_renewal_completions) as no_new_work;
