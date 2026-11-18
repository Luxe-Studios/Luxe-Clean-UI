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




---@alias NotificationPosition 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left' | 'center-right' | 'center-left'
---@alias NotificationType 'info' | 'warning' | 'success' | 'error'
---@alias IconAnimationType 'spin' | 'spinPulse' | 'spinReverse' | 'pulse' | 'beat' | 'fade' | 'beatFade' | 'bounce' | 'shake'

---@class NotifyProps
---@field id? string
---@field title? string
---@field description? string
---@field duration? number
---@field showDuration? boolean
---@field position? NotificationPosition
---@field type? NotificationType
---@field style? { [string]: any }
---@field icon? string | { [1]: IconProp, [2]: string }
---@field iconAnimation? IconAnimationType
---@field iconColor? string
---@field alignIcon? 'top' | 'center'
---@field sound? { bank?: string, set: string, name: string }

local settings = require 'resource.settings'

---`client`
---@param data NotifyProps
---@diagnostic disable-next-line: duplicate-set-field
function lib.notify(data)
    local sound = settings.notification_audio and data.sound
    local payload = table.clone(data)
    payload.sound = nil
    payload.position = payload.position or settings.notification_position

    -- Luxe Clean Notify: draw it there when it's running
    local handled = false
    if GetResourceState('luxe_cleannotify') == 'started' then
        local ok, res = pcall(function() return exports.luxe_cleannotify:oxNotify(table.clone(payload)) end)
        handled = ok and res
    end
    if not handled then
        SendNUIMessage({
            action = 'notify',
            data = payload
        })
    end

    if not sound then return end

    if sound.bank then lib.requestAudioBank(sound.bank) end

    local soundId = GetSoundId()
    PlaySoundFrontend(soundId, sound.name, sound.set, true)
    ReleaseSoundId(soundId)

    if sound.bank then ReleaseNamedScriptAudioBank(sound.bank) end
end

---@class DefaultNotifyProps
---@field title? string
---@field description? string
---@field duration? number
---@field position? NotificationPosition
---@field status? 'info' | 'warning' | 'success' | 'error'
---@field id? number

---@param data DefaultNotifyProps
function lib.defaultNotify(data)
    -- Backwards compat for v3
    data.type = data.status
    if data.type == 'inform' then data.type = 'info' end
    return lib.notify(data --[[@as NotifyProps]])
end

RegisterNetEvent('ox_lib:notify', lib.notify)
RegisterNetEvent('ox_lib:defaultNotify', lib.defaultNotify)
