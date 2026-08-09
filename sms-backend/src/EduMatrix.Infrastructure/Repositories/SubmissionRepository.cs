using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class SubmissionRepository : ISubmissionRepository
{
    private readonly DatabaseContext _context;

    public SubmissionRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<Submission?> GetByIdAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM submissions WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<Submission>(sql, new { Id = id });
    }

    public async Task<Submission?> GetByAssignmentAndStudentAsync(Guid assignmentId, Guid studentId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM submissions WHERE assignment_id = @AssignmentId AND student_id = @StudentId";
        return await connection.QuerySingleOrDefaultAsync<Submission>(sql, new { AssignmentId = assignmentId, StudentId = studentId });
    }

    public async Task<PagedResult<Submission>> GetSubmissionsAsync(int page, int pageSize, Guid? assignmentId, Guid? studentId, SubmissionStatus? status, Guid? teacherId = null)
    {
        using var connection = _context.CreateConnection();
        
        var query = "FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE 1=1";
        var param = new DynamicParameters();

        if (assignmentId.HasValue)
        {
            query += " AND s.assignment_id = @AssignmentId";
            param.Add("AssignmentId", assignmentId.Value);
        }

        if (studentId.HasValue)
        {
            query += " AND s.student_id = @StudentId";
            param.Add("StudentId", studentId.Value);
        }

        if (teacherId.HasValue)
        {
            query += " AND a.teacher_id = @TeacherId";
            param.Add("TeacherId", teacherId.Value);
        }

        if (status.HasValue)
        {
            query += " AND s.status = @Status::submission_status";
            param.Add("Status", status.Value.ToString().ToLower());
        }

        var countSql = $"SELECT COUNT(*) {query}";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, param);

        var dataSql = $"SELECT s.* {query} ORDER BY s.submitted_at DESC LIMIT @Limit OFFSET @Offset";
        param.Add("Limit", pageSize);
        param.Add("Offset", (page - 1) * pageSize);

        var data = await connection.QueryAsync<Submission>(dataSql, param);

        return new PagedResult<Submission>(data.ToList(), totalCount, page, pageSize);
    }

    public async Task<Guid> CreateAsync(Submission submission)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO submissions (assignment_id, student_id, status, submitted_at, text_content, file_url, file_name, links, grade, feedback, graded_at, graded_by_id)
            VALUES (@AssignmentId, @StudentId, @Status::submission_status, @SubmittedAt, @TextContent, @FileUrl, @FileName, @Links, @Grade, @Feedback, @GradedAt, @GradedById)
            RETURNING id;";
            
        var id = await connection.ExecuteScalarAsync<Guid>(sql, new { 
            submission.AssignmentId, 
            submission.StudentId, 
            Status = submission.Status.ToString().ToLower(),
            submission.SubmittedAt,
            submission.TextContent,
            submission.FileUrl,
            submission.FileName,
            submission.Links,
            submission.Grade,
            submission.Feedback,
            submission.GradedAt,
            submission.GradedById
        });
        
        submission.Id = id;
        return id;
    }

    public async Task UpdateAsync(Submission submission)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            UPDATE submissions SET 
                assignment_id = @AssignmentId,
                student_id = @StudentId,
                status = @Status::submission_status,
                submitted_at = @SubmittedAt,
                text_content = @TextContent,
                file_url = @FileUrl,
                file_name = @FileName,
                links = @Links,
                grade = @Grade,
                feedback = @Feedback,
                graded_at = @GradedAt,
                graded_by_id = @GradedById
            WHERE id = @Id;";
            
        await connection.ExecuteAsync(sql, new { 
            submission.Id,
            submission.AssignmentId, 
            submission.StudentId, 
            Status = submission.Status.ToString().ToLower(),
            submission.SubmittedAt,
            submission.TextContent,
            submission.FileUrl,
            submission.FileName,
            submission.Links,
            submission.Grade,
            submission.Feedback,
            submission.GradedAt,
            submission.GradedById
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM submissions WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }
}
