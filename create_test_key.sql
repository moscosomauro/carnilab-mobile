-- Create a test license key for the user to sign up with
insert into access_keys (key, label, plan, slug)
values ('PRUEBA-NUEVA', 'Usuario Prueba', 'pro', 'usuario-prueba')
on conflict (key) do nothing;
