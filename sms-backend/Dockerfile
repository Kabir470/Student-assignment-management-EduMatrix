# Use official .NET SDK image to build and publish the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the csproj files and restore dependencies
COPY ["src/EduMatrix.API/EduMatrix.API.csproj", "src/EduMatrix.API/"]
COPY ["src/EduMatrix.Application/EduMatrix.Application.csproj", "src/EduMatrix.Application/"]
COPY ["src/EduMatrix.Domain/EduMatrix.Domain.csproj", "src/EduMatrix.Domain/"]
COPY ["src/EduMatrix.Infrastructure/EduMatrix.Infrastructure.csproj", "src/EduMatrix.Infrastructure/"]
RUN dotnet restore "src/EduMatrix.API/EduMatrix.API.csproj"

# Copy the remaining source code
COPY . .

# Build and publish the API project
WORKDIR "/src/src/EduMatrix.API"
RUN dotnet publish "EduMatrix.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use ASP.NET Core runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port and start application
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "EduMatrix.API.dll"]
