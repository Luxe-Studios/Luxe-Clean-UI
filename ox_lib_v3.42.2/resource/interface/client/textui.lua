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




---@class TextUIOptions
---@field position? 'right-center' | 'left-center' | 'top-center' | 'bottom-center';
---@field icon? string | {[1]: IconProp, [2]: string};
---@field iconColor? string;
---@field style? string | table;
---@field alignIcon? 'top' | 'center';

local isOpen = false
local currentText

---@param text string
---@param options? TextUIOptions
function lib.showTextUI(text, options)
    if currentText == text then return end

    if not options then options = {} end

    options.text = text
    currentText = text

    SendNUIMessage({
        action = 'textUi',
        data = options
    })

    isOpen = true
end

function lib.hideTextUI()
    SendNUIMessage({
        action = 'textUiHide'
    })

    isOpen = false
    currentText = nil
end

---@return boolean, string | nil
function lib.isTextUIOpen()
    return isOpen, currentText
end
