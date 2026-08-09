using System.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace EduMatrix.Infrastructure.Persistence;

public class DatabaseContext
{
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public DatabaseContext(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? throw new System.Exception("Database connection string not found.");
    }

    public IDbConnection CreateConnection()
        => new NpgsqlConnection(_connectionString);
}
