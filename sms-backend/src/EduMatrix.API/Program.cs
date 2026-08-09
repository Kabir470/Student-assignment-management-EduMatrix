using System.Text;
using EduMatrix.API.Middleware;
using EduMatrix.API.Services;
using EduMatrix.Application;
using EduMatrix.Application.Common;
using EduMatrix.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Serilog;

System.Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "1");
var builder = WebApplication.CreateBuilder(args);

if (System.IO.File.Exists("../../.env"))
{
    DotNetEnv.Env.Load("../../.env");
}
else if (System.IO.File.Exists(".env"))
{
    DotNetEnv.Env.Load(".env");
}

// Configure Serilog
// builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddTransient<Microsoft.AspNetCore.Authentication.IClaimsTransformation, EduMatrix.API.Services.SupabaseRoleClaimsTransformation>();

// Add Architecture Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

var supabaseUrl = builder.Configuration["Supabase:Url"];
var jwksUrl = $"{supabaseUrl}/auth/v1/.well-known/jwks.json";
var jwksJson = new System.Net.Http.HttpClient().GetStringAsync(jwksUrl).Result;
var keys = new Microsoft.IdentityModel.Tokens.JsonWebKeySet(jwksJson).GetSigningKeys();

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKeys = keys,
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = System.TimeSpan.Zero
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
