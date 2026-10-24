# 部署指南（Docker + Nginx 反向代理）

## 架构

```
浏览器 ──80──► nginx(frontend)
                 ├── /          → React 静态文件
                 ├── /api/*     → backend:8080
                 └── /uploads/* → backend:8080
                        │
                   backend (Spring Boot)
                        │
                   mysql:3306
```

三个容器由 `docker-compose.yml` 编排，唯一对外端口是 80（可配置）。

## 服务器要求

- Linux 云服务器（推荐 2C4G 起步）
- 已安装 Docker 和 Docker Compose 插件

### 安装 Docker（如未安装）

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # 重新登录生效
```

### 国内服务器：配置镜像加速

编辑 `/etc/docker/daemon.json`（没有就新建）：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.net"
  ]
}
```

然后重启 Docker：

```bash
sudo systemctl restart docker
```

## 部署步骤

```bash
# 1. 拉取代码
git clone https://github.com/Boo513/music_platform.git
cd music_platform

# 2. 配置环境变量
cp .env.example .env
vim .env    # 修改 MYSQL_ROOT_PASSWORD 和 APP_JWT_SECRET 为强密码/随机串

# 3. 构建并启动
docker compose up -d --build

# 4. 查看状态
docker compose ps
docker compose logs -f backend   # 等待 Spring Boot 启动完成
```

启动完成后访问 `http://服务器IP` 即可。

## 常用运维命令

```bash
docker compose logs -f            # 查看日志
docker compose restart backend    # 重启后端
docker compose down               # 停止（保留数据）
docker compose down -v            # ⚠️ 停止并删除数据卷（会丢数据库和上传文件！）
docker compose up -d --build      # 更新代码后重新部署
```

## 数据持久化

| 数据 | 位置 |
|------|------|
| MySQL 数据 | Docker 卷 `music-platform_mysql_data` |
| 上传的音乐/封面/MV | Docker 卷 `music-platform_uploads_data` |

备份数据库：

```bash
docker exec music-mysql mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" music_platform > backup.sql
```

备份上传文件：

```bash
docker run --rm -v music-platform_uploads_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_backup.tar.gz -C /data .
```

## 注意事项

1. **必须修改 `.env` 中的密码和 JWT 密钥**，不要用默认值上线
2. **不要执行 `docker compose down -v`**，除非确定要清空所有数据
3. 端口 80 被占用时，修改 `.env` 中 `HTTP_PORT=8081` 等
4. 首次启动会自动执行 `schema.sql` 初始化数据库，MySQL 卷为空时才会执行
5. AI 接口（`/api/ai/*`）依赖的外部服务未部署，相关功能不可用，不影响音乐播放主功能

## 更新部署

```bash
cd music_platform
git pull
docker compose up -d --build
```

## （可选）配置 HTTPS

有域名后可加 Nginx + Let's Encrypt，或在云厂商控制台配置 SSL 证书/CDN。当前架构中前端 Nginx 监听 80，加 HTTPS 时修改 `frontend/nginx.conf` 并映射 443 端口即可。
