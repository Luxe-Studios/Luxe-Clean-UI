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


local input

---@class InputDialogRowProps
---@field type 'input' | 'number' | 'checkbox' | 'select' | 'slider' | 'multi-select' | 'date' | 'date-range' | 'time' | 'textarea' | 'color'
---@field label string
---@field options? { value: string, label: string, default?: string }[]
---@field password? boolean
---@field icon? string | {[1]: IconProp, [2]: string};
---@field iconColor? string
---@field placeholder? string
---@field default? string | number
---@field disabled? boolean
---@field checked? boolean
---@field min? number
---@field max? number
---@field step? number
---@field autosize? boolean
---@field required? boolean
---@field format? string
---@field returnString? boolean
---@field clearable? boolean
---@field searchable? boolean
---@field description? string
---@field maxSelectedValues? number
---@field minLength? number
---@field maxLength? number

---@class InputDialogOptionsProps
---@field allowCancel? boolean
---@field size? 'xs' | 'sm' | 'md' | 'lg' | 'xl'

---@param heading string
---@param rows string[] | InputDialogRowProps[]
---@param options InputDialogOptionsProps[]?
---@return string[] | number[] | boolean[] | nil
function lib.inputDialog(heading, rows, options)
    if input then return end
    input = promise.new()

    -- Backwards compat with string tables (build a normalized copy, don't mutate caller's rows)
    local normalized = table.create(#rows, 0)

    for i = 1, #rows do
        local row = rows[i]
        normalized[i] = type(row) == 'string'
            and { type = 'input', label = row --[[@as string]] }
            or row
    end

    lib.setNuiFocus(false)
    SendNUIMessage({
        action = 'openDialog',
        data = {
            heading = heading,
            rows = normalized,
            options = options
        }
    })

    return Citizen.Await(input)
end

function lib.closeInputDialog()
    if not input then return end

    lib.resetNuiFocus()
    SendNUIMessage({
        action = 'closeInputDialog'
    })

    input:resolve(nil)
    input = nil
end

RegisterNUICallback('inputData', function(data, cb)
    cb(1)
    lib.resetNuiFocus()

    local promise = input
    input = nil

    promise:resolve(data)
end)
