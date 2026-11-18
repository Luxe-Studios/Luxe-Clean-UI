--[[
    https://github.com/overextended/ox_lib

    This file is licensed under LGPL-3.0 or higher <https://www.gnu.org/licenses/lgpl-3.0.en.html>

    Copyright © 2025 Linden <https://github.com/thelindat>
]]

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


---@type promise?
local alert = nil
local alertId = 0

---@class AlertDialogProps
---@field header string;
---@field content string;
---@field centered? boolean?;
---@field size? 'xs' | 'sm' | 'md' | 'lg' | 'xl';
---@field overflow? boolean?;
---@field cancel? boolean?;
---@field labels? {cancel?: string, confirm?: string}

---@param data AlertDialogProps
---@param timeout? number Force the window to timeout after `x` milliseconds.
---@return 'cancel' | 'confirm' | nil
function lib.alertDialog(data, timeout)
    if alert then return end

    local id = alertId + 1
    alertId = id
    alert = promise.new()

    lib.setNuiFocus(false)
    SendNUIMessage({
        action = 'sendAlert',
        data = data
    })

    if timeout then
        SetTimeout(timeout, function()
            if id == alertId then lib.closeAlertDialog('timeout') end
        end)
    end

    return Citizen.Await(alert)
end

---@param reason? string An optional reason for the window to be closed.
function lib.closeAlertDialog(reason)
    if not alert then return end

    lib.resetNuiFocus()
    SendNUIMessage({
        action = 'closeAlertDialog'
    })

    local p = alert
    alert = nil

    if reason then p:reject(reason) else p:resolve() end
end

RegisterNUICallback('closeAlert', function(data, cb)
    cb(1)
    lib.resetNuiFocus()

    local promise = alert --[[@as promise]]
    alert = nil

    promise:resolve(data)
end)

RegisterNetEvent('ox_lib:alertDialog', lib.alertDialog)
