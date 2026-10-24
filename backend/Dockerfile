# 阶段1：Maven 构建
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# 先只拷贝 pom.xml 利用 Docker 缓存下载依赖
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 拷贝源码并打包
COPY src ./src
RUN mvn package -DskipTests -B

# 阶段2：运行时镜像
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /build/target/music-platform-1.0.0.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
