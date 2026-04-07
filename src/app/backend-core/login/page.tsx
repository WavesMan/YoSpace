"use client";

import React, { useState } from "react";
import styles from "./LoginPage.module.css";

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
        <div className={styles.loginPageRoot}>
            <form onSubmit={handleSubmit} className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <h1 className={styles.loginTitle}>
                        管理员登录
                    </h1>
                    <p className={styles.loginSubtitle}>
                        请输入管理员账号和密码，仅授权用户可访问后台管理功能。
                    </p>
                </div>
                <div className={styles.loginField}>
                    <label className={styles.loginLabel} htmlFor="admin-username">
                        用户名
                    </label>
                    <input
                        id="admin-username"
                        type="text"
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        autoComplete="username"
                        className={styles.loginInput}
                    />
                </div>
                <div className={styles.loginField}>
                    <label className={styles.loginLabel} htmlFor="admin-password">
                        密码
                    </label>
                    <input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        autoComplete="current-password"
                        className={styles.loginInput}
                    />
                </div>
                {errorMessage && (
                    <div className={styles.loginError}>
                        {errorMessage}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className={`${styles.loginButton} ${submitting ? styles.loginButtonDisabled : ""}`}
                >
                    {submitting ? "登录中..." : "登录"}
                </button>
            </form>
        </div>
    );
};

export default AdminLoginPage;
