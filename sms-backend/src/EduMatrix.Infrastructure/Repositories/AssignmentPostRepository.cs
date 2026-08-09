using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Application.AssignmentPosts;
using EduMatrix.Application.AssignmentPosts.DTOs;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class AssignmentPostRepository : IAssignmentPostRepository
{
    private readonly DatabaseContext _db;

    public AssignmentPostRepository(DatabaseContext db)
    {
        _db = db;
    }

    public async Task<List<AssignmentPostDto>> GetPostsForAssignmentAsync(Guid assignmentId)
    {
        using var connection = _db.CreateConnection();
        var sql = @"
            SELECT 
                p.id, p.assignment_id as AssignmentId, p.author_id as AuthorId, p.content, p.created_at as CreatedAt,
                u.first_name || ' ' || u.last_name as AuthorName,
                u.role as AuthorRole
            FROM assignment_posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.assignment_id = @AssignmentId
            ORDER BY p.created_at DESC;

            SELECT 
                c.id, c.post_id as PostId, c.author_id as AuthorId, c.content, c.created_at as CreatedAt,
                u.first_name || ' ' || u.last_name as AuthorName,
                u.role as AuthorRole
            FROM assignment_post_comments c
            JOIN users u ON c.author_id = u.id
            WHERE c.post_id IN (SELECT id FROM assignment_posts WHERE assignment_id = @AssignmentId)
            ORDER BY c.created_at ASC;
        ";

        using var multi = await connection.QueryMultipleAsync(sql, new { AssignmentId = assignmentId });
        var posts = (await multi.ReadAsync<AssignmentPostDto>()).ToList();
        var comments = (await multi.ReadAsync<AssignmentPostCommentDto>()).ToList();

        foreach (var post in posts)
        {
            post.Comments = comments.Where(c => c.PostId == post.Id).ToList();
        }

        return posts;
    }

    public async Task<Guid> CreatePostAsync(Guid assignmentId, Guid authorId, string content)
    {
        using var connection = _db.CreateConnection();
        var sql = @"
            INSERT INTO assignment_posts (assignment_id, author_id, content)
            VALUES (@AssignmentId, @AuthorId, @Content)
            RETURNING id;
        ";
        
        return await connection.ExecuteScalarAsync<Guid>(sql, new { AssignmentId = assignmentId, AuthorId = authorId, Content = content });
    }

    public async Task<Guid> CreateCommentAsync(Guid postId, Guid authorId, string content)
    {
        using var connection = _db.CreateConnection();
        var sql = @"
            INSERT INTO assignment_post_comments (post_id, author_id, content)
            VALUES (@PostId, @AuthorId, @Content)
            RETURNING id;
        ";
        
        return await connection.ExecuteScalarAsync<Guid>(sql, new { PostId = postId, AuthorId = authorId, Content = content });
    }

    public async Task<Guid?> GetPostAuthorIdAsync(Guid postId)
    {
        using var connection = _db.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Guid?>("SELECT author_id FROM assignment_posts WHERE id = @Id", new { Id = postId });
    }

    public async Task DeletePostAsync(Guid id)
    {
        using var connection = _db.CreateConnection();
        await connection.ExecuteAsync("DELETE FROM assignment_posts WHERE id = @Id", new { Id = id });
    }
}
