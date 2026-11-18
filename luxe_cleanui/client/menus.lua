-- Luxe Clean UI menus: draws ox_lib's context menu, radial menu, input/alert dialogs and list menu.
-- ox_lib keeps all the logic (callbacks into other scripts); we only render and send clicks back.

local OPEN = { showContext = true, sendAlert = true, openDialog = true, setMenu = true, openRadialMenu = true }
local CLOSE = { hideContext = true, closeAlertDialog = true, closeInputDialog = true, closeMenu = true }
local releaseTimer = 0

-- Strip functions / function refs so the table can be sent to the UI
local function sanitize(v, depth)
    depth = depth or 0
    local t = type(v)
    if t == 'function' or t == 'userdata' or depth > 12 then return nil end
    if t ~= 'table' then return v end
    if rawget(v, '__cfx_functionReference') then return nil end
    local out = {}
    for k, val in pairs(v) do
        local s = sanitize(val, depth + 1)
        if s ~= nil then out[k] = s end
    end
    return out
end

local MOVE_OK = { showContext = true, setMenu = true, openRadialMenu = true }
local walking = false

-- While a menu is open and the player can move: block camera look, shooting and the pause menu
local function walkThread()
    if walking then return end
    walking = true
    CreateThread(function()
        while walking do
            DisableControlAction(0, 1, true)   -- look left/right
            DisableControlAction(0, 2, true)   -- look up/down
            DisableControlAction(0, 24, true)  -- attack
            DisableControlAction(0, 25, true)  -- aim
            DisableControlAction(0, 140, true); DisableControlAction(0, 141, true); DisableControlAction(0, 142, true) -- melee
            DisableControlAction(0, 199, true); DisableControlAction(0, 200, true) -- pause menu (Esc closes the menu instead)
            DisableControlAction(0, 106, true) -- vehicle mouse control
            DisablePlayerFiring(cache.playerId, true)
            Wait(0)
        end
    end)
end

local function takeFocus(spec, action)
    releaseTimer = releaseTimer + 1
    spec = spec or {}
    local keep = spec.allowInput and true or false
    if Config.Menus.allowMovement and MOVE_OK[action] then keep = true end
    SetNuiFocus(true, not spec.disableCursor)
    SetNuiFocusKeepInput(keep)
    if keep then walkThread() else walking = false end
end

local function releaseFocus(delay)
    releaseTimer = releaseTimer + 1
    local id = releaseTimer
    local function go()
        if id ~= releaseTimer then return end -- reopened in the meantime (e.g. radial submenu)
        SetNuiFocus(false, false)
        SetNuiFocusKeepInput(false)
        walking = false
    end
    if delay then SetTimeout(delay, go) else go() end
end

---Called from the ox_lib patch. Returns 'focus' when we took NUI focus, true when handled, false otherwise.
function OxMenuUI(msg, focusSpec)
    local action = msg.action
    if not OPEN[action] and not CLOSE[action] then return false end

    SendNUIMessage({ action = 'ox', data = { action = action, data = sanitize(msg.data) } })

    if action == 'openRadialMenu' and not msg.data then
        releaseFocus(200) -- radial hides briefly between submenus
        return true
    end
    if OPEN[action] then
        takeFocus(focusSpec, action)
        return 'focus'
    end
    releaseFocus()
    return true
end

-- Clicks from the Luxe UI -> back into ox_lib's own handlers
RegisterNUICallback('oxcb', function(body, cb)
    cb(1)
    if type(body) ~= 'table' or type(body.name) ~= 'string' then return end
    if body.close then releaseFocus() end
    local data = body.data
    if body.name == 'clickContext' and type(data) == 'number' then data = math.tointeger(math.floor(data)) end
    TriggerEvent(('luxe_cleanui:oxcb:%s'):format(body.name), data)
end)
