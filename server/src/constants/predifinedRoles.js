"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRolesData = void 0;
// Define default roles.
exports.defaultRolesData = [
    { name: "Owner", permissions: ["MANAGE_COMMUNITY", "MANAGE_ROLES", "MANAGE_MEMBERS", "MANAGE_CHANNELS", "KICK_MEMBERS", "VIEW_CONTENT", "SEND_MESSAGES"] },
    { name: "Admin", permissions: ["MANAGE_ROLES", "MANAGE_MEMBERS", "MANAGE_CHANNELS", "KICK_MEMBERS", "VIEW_CONTENT", "SEND_MESSAGES"] },
    { name: "Moderator", permissions: ["MANAGE_CHANNELS", "KICK_MEMBERS", "VIEW_CONTENT", "SEND_MESSAGES"] },
    { name: "Member", permissions: ["VIEW_CONTENT", "SEND_MESSAGES"] },
    { name: "Guest", permissions: ["VIEW_CONTENT"] }
];
