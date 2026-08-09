using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class SubmissionCommentRepository : ISubmissionCommentRepository
{
    private readonly DatabaseContext _context;

    public SubmissionCommentRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<List<SubmissionComment>> GetBySubmissionIdAsync(Guid submissionId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM submission_comments WHERE submission_id = @SubmissionId ORDER BY created_at ASC";
        var result = await connection.QueryAsync<SubmissionComment>(sql, new { SubmissionId = submissionId });
        return result.AsList();
    }

    public async Task<Guid> CreateAsync(SubmissionComment comment)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO submission_comments (submission_id, author_id, author_name, author_role, content, created_at, updated_at)
            VALUES (@SubmissionId, @AuthorId, @AuthorName, @AuthorRole, @Content, @CreatedAt, @UpdatedAt)
            RETURNING id;";
        return await connection.ExecuteScalarAsync<Guid>(sql, new
        {
            comment.SubmissionId,
            comment.AuthorId,
            comment.AuthorName,
            comment.AuthorRole,
            comment.Content,
            comment.CreatedAt,
            comment.UpdatedAt
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM submission_comments WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }
}
