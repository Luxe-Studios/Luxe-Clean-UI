# Luxe Clean UI
A clean restyle of every ox_lib menu, so your whole server matches the Luxe Clean set.
ox_lib still runs all the logic, so every script keeps working the same.

## What it restyles
- **Context menus** (`lib.registerContext` / `lib.showContext`): icons, descriptions, progress bars, hover info, sub-menus
- **List menus** (`lib.registerMenu`): arrow keys, scroll values, checkboxes
- **Radial menu** (`lib.addRadialItem`, qbx_radialmenu): point to pick, number keys, pages, sub-menus
- **Input dialogs** (`lib.inputDialog`): text, number, select, multi-select, slider, checkbox, colour, date, time
- **Alert dialogs** (`lib.alertDialog`)
- **Text UI** (`lib.showTextUI`): `[E] Open garage` prompts with a key badge
- Notifications and progress bars: use **Luxe Clean Notify & Progress** with it

Uses the player's `/notify` colour and style (Luxe Clean Notify), or Luxe Clean HUD's colour.

## Install
1. `luxe_cleanui` in your resources, `ensure luxe_cleanui` after `ox_lib`.
2. ox_lib hook: in each of these files in `ox_lib/resource/interface/client/`:
   `context.lua`, `menu.lua`, `radial.lua`, `alert.lua`, `input.lua`, `textui.lua` (and `notify.lua`, `progress.lua` if you like)
   paste this under the license comment at the top:
```lua
-- Luxe Clean UI: draw this UI with luxe_cleanui when it's running --
local function luxeUI(msg)
    if type(msg) ~= 'table' or GetResourceState('luxe_cleanui') ~= 'started' then return false end
    local ok, res = pcall(function() return exports.luxe_cleanui:oxUI(msg, LuxeFocus) end)
    if ok and res then
        if res == 'focus' then SetNuiFocus(false, false) end -- luxe_cleanui has focus now
        return true
    end
    return false
end
local SendNUIMessage = function(msg) if not luxeUI(msg) then return _G.SendNUIMessage(msg) end end
local SendNuiMessage = function(str)
    local ok, msg = pcall(json.decode, str)
    if not (ok and luxeUI(msg)) then return _G.SendNuiMessage(str) end
end
local RegisterNUICallback = function(name, fn)
    _G.RegisterNUICallback(name, fn)
    AddEventHandler(('luxe_cleanui:oxcb:%s'):format(name), function(data) fn(data, function() end) end)
end
-- end Luxe Clean UI --
```
3. In `ox_lib/resource/interface/client/main.lua`, first line inside `function lib.setNuiFocus(allowInput, disableCursor)`:
```lua
    LuxeFocus = { allowInput = allowInput, disableCursor = disableCursor } -- Luxe Clean UI
```
4. Restart the whole server. If `luxe_cleanui` is stopped, ox_lib draws its normal UI again.

Try it: `/uitest context`, `/uitest menu`, `/uitest input`, `/uitest alert`, `/uitest textui`.

## Config
`config.lua`: accent, glass / solid, walk while menus are open, text UI position, radial style and size.

Font Awesome Free icons are included (see `html/fa/LICENSE.txt`).
