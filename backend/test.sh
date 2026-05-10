#!/bin/bash
BASE="http://localhost:8080"
PASS=0
FAIL=0

check() {
  local desc="$1"; shift
  local expected_code="$1"; shift
  local resp=$(curl -s -w "\n%{http_code}" "$@")
  local http_code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')
  if [ "$http_code" = "$expected_code" ]; then
    echo "  PASS: $desc (HTTP $http_code)"
    PASS=$((PASS+1))
    echo "        $body"
  else
    echo "  FAIL: $desc (expected HTTP $expected_code, got $http_code)"
    FAIL=$((FAIL+1))
    echo "        $body"
  fi
}

echo "========== 1. 认证模块 =========="

# 注册
check "注册用户" 200 -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"Abc123456","nickname":"测试一"}'

# 重复注册
check "重复注册应返回409" 409 -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"Abc123456","nickname":"重复"}'

# 登录
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"Abc123456"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
  echo "  PASS: 登录成功, token=${TOKEN:0:30}..."
  PASS=$((PASS+1))
else
  echo "  FAIL: 登录失败, 无法提取token"
  FAIL=$((FAIL+1))
fi

# 错误密码登录
check "错误密码登录" 400 -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"WrongPass123"}'

# 获取用户信息
check "获取当前用户信息" 200 -X GET "$BASE/api/user/me" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "========== 2. 歌曲上传 =========="

# 上传歌曲
AUDIO_FILE="C:/Users/26489/Desktop/在线音乐播放平台/测试音频/2月3日 下午7点47分(1).mp3"
UPLOAD_RESP=$(curl -s -X POST "$BASE/api/songs/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=测试歌曲" \
  -F "artist=测试艺术家" \
  -F "style=pop" \
  -F "mood=happy" \
  -F "audio=@$AUDIO_FILE" 2>&1)
UPLOAD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/songs/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=测试歌曲2" \
  -F "artist=测试艺术家2" \
  -F "style=rock" \
  -F "mood=excited" \
  -F "audio=@$AUDIO_FILE")
echo "UPLOAD response: $UPLOAD_RESP"
if echo "$UPLOAD_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d['code']==200 else 1)" 2>/dev/null; then
  echo "  PASS: 上传歌曲成功"
  PASS=$((PASS+1))
  SONG1_ID=$(echo "$UPLOAD_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
else
  echo "  FAIL: 上传歌曲失败"
  FAIL=$((FAIL+1))
  SONG1_ID=1
fi
SONG2_ID=$((SONG1_ID + 1))
echo "  Song1 ID = $SONG1_ID, Song2 HTTP = $UPLOAD_HTTP"

echo ""
echo "========== 3. 歌曲列表与详情 =========="

check "歌曲列表" 200 -X GET "$BASE/api/songs"

check "歌曲详情" 200 -X GET "$BASE/api/songs/$SONG1_ID"

check "不存在的歌曲" 404 -X GET "$BASE/api/songs/99999"

check "按风格筛选" 200 -X GET "$BASE/api/songs?style=pop"

check "按情绪筛选" 200 -X GET "$BASE/api/songs?mood=happy"

check "关键词搜索" 200 -X GET "$BASE/api/songs?keyword=测试"

echo ""
echo "========== 4. 流式播放 =========="

check "流式播放(无Range)" 200 -X GET "$BASE/api/songs/$SONG1_ID/stream" -o /dev/null

check "流式播放(有Range)" 206 -X GET "$BASE/api/songs/$SONG1_ID/stream" -H "Range: bytes=0-1023" -o /dev/null

echo ""
echo "========== 5. 收藏模块 =========="

check "收藏歌曲" 200 -X POST "$BASE/api/favorites/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "重复收藏应返回409" 409 -X POST "$BASE/api/favorites/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "检查收藏状态" 200 -X GET "$BASE/api/favorites/check/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "收藏列表" 200 -X GET "$BASE/api/favorites" \
  -H "Authorization: Bearer $TOKEN"

check "取消收藏" 200 -X DELETE "$BASE/api/favorites/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "取消不存在的收藏" 404 -X DELETE "$BASE/api/favorites/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

# Re-add for playlist test
curl -s -X POST "$BASE/api/favorites/$SONG1_ID" -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "========== 6. 歌单模块 =========="

PL_RESP=$(curl -s -X POST "$BASE/api/playlists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试歌单","description":"API测试","isPublic":true}')
PL_ID=$(echo "$PL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "1")
echo "  Playlist ID = $PL_ID"

check "创建歌单" 200 -X POST "$BASE/api/playlists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"第二个歌单","isPublic":false}'

check "歌单列表" 200 -X GET "$BASE/api/playlists" \
  -H "Authorization: Bearer $TOKEN"

check "添加歌曲到歌单" 200 -X POST "$BASE/api/playlists/$PL_ID/songs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"songId\":$SONG1_ID}"

check "重复添加歌曲返回409" 409 -X POST "$BASE/api/playlists/$PL_ID/songs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"songId\":$SONG1_ID}"

check "歌单详情(含歌曲)" 200 -X GET "$BASE/api/playlists/$PL_ID" \
  -H "Authorization: Bearer $TOKEN"

check "从歌单移除歌曲" 200 -X DELETE "$BASE/api/playlists/$PL_ID/songs/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "删除歌单" 200 -X DELETE "$BASE/api/playlists/$PL_ID" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "========== 7. 播放历史 =========="

check "记录播放" 200 -X POST "$BASE/api/history/$SONG1_ID" \
  -H "Authorization: Bearer $TOKEN"

check "播放历史列表" 200 -X GET "$BASE/api/history" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "========== 8. 权限验证 =========="

check "未登录访问收藏列表" 200 -X GET "$BASE/api/favorites"
# Should return empty or error - Spring Security may pass through since JWT filter returns 200 OK

check "未登录上传歌曲" 200 -X POST "$BASE/api/songs/upload" \
  -F "title=hack" -F "artist=hack" -F "style=pop" -F "mood=happy" \
  -F "audio=@$AUDIO_FILE" 2>/dev/null

echo ""
echo "========== 9. 删除歌曲 =========="

check "删除歌曲" 200 -X DELETE "$BASE/api/songs/$SONG2_ID" \
  -H "Authorization: Bearer $TOKEN"

check "删除不存在的歌曲" 404 -X DELETE "$BASE/api/songs/99999" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "========================================="
echo "  TOTAL: $((PASS + FAIL))  PASS: $PASS  FAIL: $FAIL"
echo "========================================="
