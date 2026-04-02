"use client";

import React, { useState } from "react";

/**
 * 管理员登录页面
 *
 * 通过用户名与密码向 /api/admin/login 提交登录请求，
 * 登录成功后刷新当前页面，由中间件根据 Cookie 自动重写到后台仪表盘。
 *
 * @returns 管理员登录页 JSX 节点
 */
const AdminLoginPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) {
            return;
        }
        setSubmitting(true);
        setErrorMessage("");
        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                const message = data?.message || "登录失败，请检查用户名和密码。";
                setErrorMessage(message);
                setSubmitting(false);
                return;
            }
            window.location.reload();
        } catch {
            setErrorMessage("登录请求异常，请稍后重试。");
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9fafb",
                padding: 16,
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    maxWidth: 360,
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    padding: 24,
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
            >
                <h1
                    style={{
                        fontSize: 20,
                        fontWeight: 600,
                        marginBottom: 16,
                    }}
                >
                    管理员登录
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        color: "#6b7280",
                        marginBottom: 20,
                    }}
                >
                    请输入管理员账号和密码，仅授权用户可访问后台管理功能。
                </p>
                <div
                    style={{
                        marginBottom: 12,
                    }}
                >
                    <label
                        htmlFor="admin-username"
                        style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 4,
                        }}
                    >
                        用户名
                    </label>
                    <input
                        id="admin-username"
                        type="text"
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        autoComplete="username"
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: 14,
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                        }}
                    />
                </div>
                <div
                    style={{
                        marginBottom: 16,
                    }}
                >
                    <label
                        htmlFor="admin-password"
                        style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 4,
                        }}
                    >
                        密码
                    </label>
                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        autoComplete="current-password"
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: 14,
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                        }}
                    />
                </div>
                {errorMessage && (
                    <div
                        style={{
                            marginBottom: 12,
                            fontSize: 13,
                            color: "#b91c1c",
                        }}
                    >
                        {errorMessage}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#ffffff",
                        backgroundColor: submitting ? "#9ca3af" : "#2563eb",
                        borderRadius: 4,
                        border: "none",
                        cursor: submitting ? "default" : "pointer",
                    }}
                >
                    {submitting ? "登录中..." : "登录"}
                </button>
            </form>
        </div>
    );
};

export default AdminLoginPage;

