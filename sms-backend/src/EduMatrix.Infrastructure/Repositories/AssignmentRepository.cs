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

public class AssignmentRepository : IAssignmentRepository
{
    private readonly DatabaseContext _context;

    public AssignmentRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<Assignment?> GetByIdAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM assignments WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<Assignment>(sql, new { Id = id });
    }

    public async Task<PagedResult<Assignment>> GetAssignmentsAsync(int page, int pageSize, string? search, Guid? courseId, Guid? teacherId, Guid? studentId, AssignmentStatus? status)
    {
        using var connection = _context.CreateConnection();
        
        var query = "FROM assignments a ";
        if (studentId.HasValue)
        {
            query += "JOIN course_enrollments ce ON a.course_id = ce.course_id ";
        }
        query += "WHERE 1=1";
        
        var param = new DynamicParameters();

        if (!string.IsNullOrEmpty(search))
        {
            query += " AND (a.title ILIKE @Search OR a.description ILIKE @Search)";
            param.Add("Search", $"%{search}%");
        }

        if (courseId.HasValue)
        {
            query += " AND a.course_id = @CourseId";
            param.Add("CourseId", courseId.Value);
        }

        if (teacherId.HasValue)
        {
            query += " AND a.teacher_id = @TeacherId";
            param.Add("TeacherId", teacherId.Value);
        }

        if (studentId.HasValue)
        {
            query += " AND ce.student_id = @StudentId AND a.status != 'draft'"; // Students only see non-drafts
            param.Add("StudentId", studentId.Value);
        }

        if (status.HasValue)
        {
            query += " AND a.status = @Status::assignment_status";
            param.Add("Status", status.Value.ToString().ToLower());
        }

        var countSql = $"SELECT COUNT(DISTINCT a.id) {query}";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, param);

        var dataSql = $"SELECT a.* {query} ORDER BY a.due_date ASC LIMIT @Limit OFFSET @Offset";
        param.Add("Limit", pageSize);
        param.Add("Offset", (page - 1) * pageSize);

        var data = await connection.QueryAsync<Assignment>(dataSql, param);

        return new PagedResult<Assignment>(data.ToList(), totalCount, page, pageSize);
    }

    public async Task<Guid> CreateAsync(Assignment assignment)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO assignments (title, description, course_id, teacher_id, status, due_date, total_marks, allowed_file_types, max_file_size_mb, attachment_url, allow_late_submissions)
            VALUES (@Title, @Description, @CourseId, @TeacherId, @Status::assignment_status, @DueDate, @TotalMarks, @AllowedFileTypes, @MaxFileSizeMb, @AttachmentUrl, @AllowLateSubmissions)
            RETURNING id;";
            
        var id = await connection.ExecuteScalarAsync<Guid>(sql, new { 
            assignment.Title, 
            assignment.Description, 
            assignment.CourseId, 
            assignment.TeacherId, 
            Status = assignment.Status.ToString().ToLower(),
            assignment.DueDate,
            assignment.TotalMarks,
            assignment.AllowedFileTypes,
            assignment.MaxFileSizeMb,
            assignment.AttachmentUrl,
            assignment.AllowLateSubmissions
        });
        
        assignment.Id = id;
        return id;
    }

    public async Task UpdateAsync(Assignment assignment)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            UPDATE assignments SET 
                title = @Title,
                description = @Description,
                course_id = @CourseId,
                teacher_id = @TeacherId,
                status = @Status::assignment_status,
                due_date = @DueDate,
                total_marks = @TotalMarks,
                allowed_file_types = @AllowedFileTypes,
                max_file_size_mb = @MaxFileSizeMb,
                attachment_url = @AttachmentUrl,
                allow_late_submissions = @AllowLateSubmissions
            WHERE id = @Id;";
            
        await connection.ExecuteAsync(sql, new { 
            assignment.Id,
            assignment.Title, 
            assignment.Description, 
            assignment.CourseId, 
            assignment.TeacherId, 
            Status = assignment.Status.ToString().ToLower(),
            assignment.DueDate,
            assignment.TotalMarks,
            assignment.AllowedFileTypes,
            assignment.MaxFileSizeMb,
            assignment.AttachmentUrl,
            assignment.AllowLateSubmissions
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM assignments WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }
}
