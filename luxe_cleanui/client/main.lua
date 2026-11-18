-- Luxe Clean UI (client): receives ox_lib's UI messages (through the hook in ox_lib) and draws them here.

local function started(res) return GetResourceState(res) == 'started' end

---------------------------------------------------------------- look (shared with Clean Notify / Clean HUD)
local lastLook
local function look()
    local accent, bg, size = Config.Accent, Config.Background, 'normal'
    if started('luxe_cleanhud') then
        local ok, s = pcall(function() return exports.luxe_cleanhud:getSettings() end)
        if ok and type(s) == 'table' and s.accent then accent = s.accent end
    end
    if started('luxe_cleannotify') then
        local ok, s = pcall(function() return exports.luxe_cleannotify:getSettings() end)
        if ok and type(s) == 'table' then
            if type(s.accent) == 'string' and s.accent:match('^#%x%x%x%x%x%x$') then accent = s.accent end
            if s.theme == 'solid' or s.theme == 'light' then bg = 'solid' elseif s.theme == 'glass' then bg = 'glass' end
            size = s.size or size
        end
    end
    return { accent = accent, background = bg, size = size, radialStyle = Config.Radial.style, radialScale = Config.Radial.scale }
end

function ApplyLook()
    local l = look()
    local key = json.encode(l)
    if key == lastLook then return end
    lastLook = key
    SendNUIMessage({ action = 'look', data = l })
end

---------------------------------------------------------------- text UI ([E] prompts)
local textOpen = false
local function showTextUI(data)
    data = data or {}
    local text = tostring(data.text or '')
    local key, rest = text:match('^%s*%[(.-)%]%s*%-?%s*(.*)$')
    local pos = Config.TextUI.position ~= 'auto' and Config.TextUI.position or nil
    if not pos then
        local p = tostring(data.position or 'right-center')
        pos = p:find('left') and 'left' or p:find('top') and 'top' or p:find('bottom') and 'bottom' or 'right'
    end
    local ic = data.icon
    if type(ic) == 'table' then ic = ic[2] end
    SendNUIMessage({ action = 'textui', data = {
        show = true, key = key, text = key and rest or text, position = pos,
        icon = type(ic) == 'string' and ic or nil, iconColor = data.iconColor,
    } })
    textOpen = true
end

local function hideTextUI()
    SendNUIMessage({ action = 'textui', data = { show = false } })
    textOpen = false
end

---------------------------------------------------------------- the ox_lib hook calls this
-- Return 'focus' when we took NUI focus, true when we drew it, false to let ox_lib draw it itself.
exports('oxUI', function(msg, focusSpec)
    if type(msg) ~= 'table' then return false end
    ApplyLook()
    local menu = OxMenuUI(msg, focusSpec)
    if menu then return menu end
    if msg.action == 'textUi' then showTextUI(msg.data) return true end
    if msg.action == 'textUiHide' then hideTextUI() return true end
    return false -- notifications / progress: Luxe Clean Notify or ox_lib itself
end)

exports('isTextUIOpen', function() return textOpen end)

CreateThread(function()
    Wait(1000)
    ApplyLook()
    while true do
        Wait(3000)
        ApplyLook() -- pick up /hud or /notify colour changes
    end
end)

---------------------------------------------------------------- try it: /uitest
RegisterCommand('uitest', function(_, args)
    local what = args[1] or 'context'
    if what == 'context' then
        lib.registerContext({
            id = 'luxe_cleanui_test', title = 'Mechanic Shop',
            options = {
                { title = 'Repair vehicle', description = 'Fix the engine and body', icon = 'wrench', onSelect = function() lib.notify({ title = 'Repair', description = 'Repair started', type = 'success' }) end },
                { title = 'Business level', description = '1,250 / 2,000 rep', icon = 'star', progress = 62, readOnly = true },
                { title = 'Upgrades', description = 'Engine, brakes, turbo', icon = 'gauge-high', arrow = true, metadata = { { label = 'Engine', value = 'Level 3' }, { label = 'Turbo', value = 'Installed' } } },
                { title = 'Locked', description = 'Reach level 5', icon = 'lock', disabled = true },
            },
        })
        lib.showContext('luxe_cleanui_test')
    elseif what == 'input' then
        local r = lib.inputDialog('Create invoice', {
            { type = 'input', label = 'Customer', placeholder = 'John Smith', icon = 'user', required = true },
            { type = 'number', label = 'Amount', icon = 'dollar-sign', default = 250, min = 1 },
            { type = 'select', label = 'Reason', options = { { value = 'repair', label = 'Repair' }, { value = 'tow', label = 'Tow' } } },
            { type = 'checkbox', label = 'Send receipt', checked = true },
        })
        if r then lib.notify({ title = 'Invoice', description = ('Sent $%s to %s'):format(r[2] or 0, r[1]), type = 'success' }) end
    elseif what == 'alert' then
        local a = lib.alertDialog({ header = 'Sell vehicle?', content = 'You will receive **$12,500**.\n\nThis can\'t be undone.', centered = true, cancel = true })
        lib.notify({ description = 'You chose: ' .. tostring(a) })
    elseif what == 'menu' then
        lib.registerMenu({
            id = 'luxe_cleanui_list', title = 'Vehicle options', position = 'top-left',
            options = {
                { label = 'Engine', icon = 'gear', description = 'Turn the engine on or off' },
                { label = 'Doors', icon = 'door-open', values = { 'Front left', 'Front right', 'Rear left', 'Rear right', 'Boot' } },
                { label = 'Neon lights', icon = 'lightbulb', checked = true },
                { label = 'Fuel', icon = 'gas-pump', progress = 62 },
            },
        }, function(selected) lib.notify({ description = 'Selected option ' .. selected }) end)
        lib.showMenu('luxe_cleanui_list')
    elseif what == 'textui' then
        lib.showTextUI('[E] Open garage', { icon = 'car' })
        SetTimeout(4000, function() lib.hideTextUI() end)
    end
end, false)
