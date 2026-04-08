"use client";

import React, { useEffect, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "./LoginPage.module.css";

const ADMIN_LOGIN_STORAGE_KEY = "yo_admin_login_draft";

interface AdminLoginDraft {
    username: string;
    password: string;
    rememberPassword: boolean;
}

/**
 * 读取浏览器本地存储中的登录草稿
 *
 * @returns 登录草稿，读取失败时返回空草稿
 */
function readAdminLoginDraft(): AdminLoginDraft {
    if (typeof window === "undefined") {
        return {
            username: "",
            password: "",
            rememberPassword: false,
        };
    }
    try {
        const raw = window.localStorage.getItem(ADMIN_LOGIN_STORAGE_KEY);
        if (!raw) {
            return {
                username: "",
                password: "",
                rememberPassword: false,
            };
        }
        const parsed = JSON.parse(raw) as Partial<AdminLoginDraft>;
        return {
            username: typeof parsed.username === "string" ? parsed.username : "",
            password: typeof parsed.password === "string" ? parsed.password : "",
            rememberPassword: Boolean(parsed.rememberPassword),
        };
    } catch {
        return {
            username: "",
            password: "",
            rememberPassword: false,
        };
    }
}

/**
 * 将登录草稿写入浏览器本地存储
 *
 * @param draft 登录草稿
 */
function writeAdminLoginDraft(draft: AdminLoginDraft): void {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(ADMIN_LOGIN_STORAGE_KEY, JSON.stringify(draft));
}

/**
 * 清理登录草稿
 */
function clearAdminLoginDraft(): void {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.removeItem(ADMIN_LOGIN_STORAGE_KEY);
}

/**
 * 管理员登录页面
 *
 * 通过用户名与密码向 /api/admin/login 提交登录请求，
 * 登录成功后刷新当前页面，由中间件根据 Cookie 自动重写到后台仪表盘。
 *
 * @returns 管理员登录页 JSX 节点
 */
const AdminLoginPage: React.FC = () => {
    const [loginDraft] = useState<AdminLoginDraft>(() => readAdminLoginDraft());
    const [username, setUsername] = useState(loginDraft.username);
    const [password, setPassword] = useState(loginDraft.password);
    const [rememberPassword, setRememberPassword] = useState(loginDraft.rememberPassword);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

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
            if (rememberPassword) {
                writeAdminLoginDraft({
                    username,
                    password,
                    rememberPassword: true,
                });
            } else {
                clearAdminLoginDraft();
            }
            window.location.href = window.location.pathname || "/admin";
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
                    <div className={styles.loginPasswordRow}>
                        <input
                            id="admin-password"
                            type={isPasswordVisible ? "text" : "password"}
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            autoComplete="current-password"
                            className={styles.loginInput}
                        />
                        <button
                            type="button"
                            className={styles.loginPasswordToggle}
                            onClick={() => setIsPasswordVisible(prev => !prev)}
                            aria-label={isPasswordVisible ? "隐藏密码" : "显示密码"}
                            title={isPasswordVisible ? "隐藏密码" : "显示密码"}
                        >
                            {isPasswordVisible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                        </button>
                    </div>
                </div>
                <label className={styles.loginRemember}>
                    <input
                        type="checkbox"
                        checked={rememberPassword}
                        onChange={event => setRememberPassword(event.target.checked)}
                        className={styles.loginRememberInput}
                    />
                    <span className={styles.loginRememberIndicator} aria-hidden="true" />
                    <span className={styles.loginRememberText}>记住密码（仅当前浏览器）</span>
                </label>
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
