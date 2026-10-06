-- Removes only the three original bundled references, not manually uploaded ads.
delete from public.overlay_sponsors
where bundled = true and id in ('muni', 'importadora', 'taquerea');
