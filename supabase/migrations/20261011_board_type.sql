-- Board shape shown as an outline in the quiver. Safe to run more than once.
alter table public.boards
  add column if not exists board_type text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'boards_board_type_check') then
    alter table public.boards add constraint boards_board_type_check check (
      board_type is null or board_type in ('shortboard', 'fish', 'midlength', 'funboard', 'longboard', 'gun', 'soft_top')
    );
  end if;
end $$;
