import { beforeEach, describe, expect, it, vi } from "vitest";

// Lock the authorization guards on sensitive server actions (plan 004).
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { update: vi.fn(), count: vi.fn() },
    player: { update: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getSession: vi.fn(),
}));

import { promoteToAdminAction, demoteToPlayerAction } from "@/server/role-actions";
import { updateAvatarAction, removeAvatarAction } from "@/server/avatar-actions";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentUser } from "@/lib/auth";

const mockAdmin = requireAdmin as ReturnType<typeof vi.fn>;
const mockUser = getCurrentUser as ReturnType<typeof vi.fn>;
const userUpdate = db.user.update as ReturnType<typeof vi.fn>;
const userCount = db.user.count as ReturnType<typeof vi.fn>;
const playerUpdate = db.player.update as ReturnType<typeof vi.fn>;

const PNG = "data:image/png;base64,iVBORw0KGgo=";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("role-actions authorization", () => {
  it("promoteToAdminAction requires admin and then updates the role", async () => {
    mockAdmin.mockResolvedValue({ userId: "a1", role: "ADMIN", email: "a@x" });
    await promoteToAdminAction("u2");
    expect(mockAdmin).toHaveBeenCalledTimes(1);
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "u2" }, data: { role: "ADMIN" } });
  });

  it("promoteToAdminAction rejects and writes nothing when not admin", async () => {
    mockAdmin.mockRejectedValue(new Error("ADMIN_REQUIRED"));
    await expect(promoteToAdminAction("u2")).rejects.toThrow(/ADMIN_REQUIRED/);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("demoteToPlayerAction refuses to demote yourself", async () => {
    mockAdmin.mockResolvedValue({ userId: "a1", role: "ADMIN", email: "a@x" });
    await expect(demoteToPlayerAction("a1")).rejects.toThrow(/cannot demote yourself/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("demoteToPlayerAction refuses to demote the last admin", async () => {
    mockAdmin.mockResolvedValue({ userId: "a1", role: "ADMIN", email: "a@x" });
    userCount.mockResolvedValue(1);
    await expect(demoteToPlayerAction("a2")).rejects.toThrow(/only remaining admin/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("demoteToPlayerAction demotes another admin when more than one exists", async () => {
    mockAdmin.mockResolvedValue({ userId: "a1", role: "ADMIN", email: "a@x" });
    userCount.mockResolvedValue(2);
    await demoteToPlayerAction("a2");
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "a2" }, data: { role: "PLAYER" } });
  });

  it("demoteToPlayerAction rejects when not admin", async () => {
    mockAdmin.mockRejectedValue(new Error("ADMIN_REQUIRED"));
    await expect(demoteToPlayerAction("a2")).rejects.toThrow(/ADMIN_REQUIRED/);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("avatar-actions authorization (owner-or-admin)", () => {
  it("lets a player update their own avatar", async () => {
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    await updateAvatarAction("p1", PNG);
    expect(playerUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { avatarUrl: PNG } });
  });

  it("blocks a player from editing someone else's avatar", async () => {
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    await expect(updateAvatarAction("p2", PNG)).rejects.toThrow(/only edit your own/i);
    expect(playerUpdate).not.toHaveBeenCalled();
  });

  it("lets an admin edit another player's avatar", async () => {
    mockUser.mockResolvedValue({ id: "admin", role: "ADMIN", player: { id: "pAdmin" } });
    await updateAvatarAction("p2", PNG);
    expect(playerUpdate).toHaveBeenCalledWith({ where: { id: "p2" }, data: { avatarUrl: PNG } });
  });

  it("rejects a non-image data URL", async () => {
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    await expect(updateAvatarAction("p1", "data:text/html;base64,AAAA")).rejects.toThrow(/invalid image/i);
    expect(playerUpdate).not.toHaveBeenCalled();
  });

  it("rejects an oversized image", async () => {
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    const huge = "data:image/png;base64," + "A".repeat(600 * 1024 + 1);
    await expect(updateAvatarAction("p1", huge)).rejects.toThrow(/too large/i);
    expect(playerUpdate).not.toHaveBeenCalled();
  });

  it("removeAvatarAction enforces the same owner-or-admin guard", async () => {
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    await expect(removeAvatarAction("p2")).rejects.toThrow(/only edit your own/i);
    expect(playerUpdate).not.toHaveBeenCalled();

    vi.clearAllMocks();
    mockUser.mockResolvedValue({ id: "u1", role: "PLAYER", player: { id: "p1" } });
    await removeAvatarAction("p1");
    expect(playerUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { avatarUrl: null } });
  });
});
