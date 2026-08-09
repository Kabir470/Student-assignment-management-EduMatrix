using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly DatabaseContext _context;

    public CourseRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<Course?> GetByIdAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM courses WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<Course>(sql, new { Id = id });
    }

    public async Task<PagedResult<Course>> GetCoursesAsync(int page, int pageSize, string? search, Guid? teacherId, Guid? studentId)
    {
        using var connection = _context.CreateConnection();
        
        var query = "FROM courses c ";
        if (studentId.HasValue)
        {
            query += "JOIN course_enrollments ce ON c.id = ce.course_id ";
        }
        query += "WHERE 1=1";
        
        var param = new DynamicParameters();

        if (!string.IsNullOrEmpty(search))
        {
            query += " AND (c.title ILIKE @Search OR c.code ILIKE @Search)";
            param.Add("Search", $"%{search}%");
        }

        if (teacherId.HasValue)
        {
            query += " AND c.teacher_id = @TeacherId";
            param.Add("TeacherId", teacherId.Value);
        }

        if (studentId.HasValue)
        {
            query += " AND ce.student_id = @StudentId";
            param.Add("StudentId", studentId.Value);
        }

        var countSql = $"SELECT COUNT(DISTINCT c.id) {query}";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, param);

        var dataSql = $"SELECT c.* {query} ORDER BY c.created_at DESC LIMIT @Limit OFFSET @Offset";
        param.Add("Limit", pageSize);
        param.Add("Offset", (page - 1) * pageSize);

        var data = await connection.QueryAsync<Course>(dataSql, param);

        return new PagedResult<Course>(data.ToList(), totalCount, page, pageSize);
    }

    public async Task<Guid> CreateAsync(Course course)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO courses (title, code, description, teacher_id, status)
            VALUES (@Title, @Code, @Description, @TeacherId, @Status::course_status)
            RETURNING id;";
            
        var id = await connection.ExecuteScalarAsync<Guid>(sql, new { 
            course.Title, 
            course.Code, 
            course.Description, 
            course.TeacherId, 
            Status = course.Status.ToString().ToLower() 
        });
        
        course.Id = id;
        return id;
    }

    public async Task UpdateAsync(Course course)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            UPDATE courses SET 
                title = @Title,
                code = @Code,
                description = @Description,
                teacher_id = @TeacherId,
                status = @Status::course_status
            WHERE id = @Id;";
            
        await connection.ExecuteAsync(sql, new { 
            course.Id,
            course.Title,
            course.Code,
            course.Description,
            course.TeacherId,
            Status = course.Status.ToString().ToLower()
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM courses WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task EnrollStudentAsync(Guid courseId, Guid studentId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "INSERT INTO course_enrollments (course_id, student_id) VALUES (@CourseId, @StudentId) ON CONFLICT DO NOTHING";
        await connection.ExecuteAsync(sql, new { CourseId = courseId, StudentId = studentId });
    }

    public async Task RemoveStudentAsync(Guid courseId, Guid studentId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM course_enrollments WHERE course_id = @CourseId AND student_id = @StudentId";
        await connection.ExecuteAsync(sql, new { CourseId = courseId, StudentId = studentId });
    }

    public async Task<bool> IsStudentEnrolledAsync(Guid courseId, Guid studentId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT 1 FROM course_enrollments WHERE course_id = @CourseId AND student_id = @StudentId";
        var result = await connection.ExecuteScalarAsync<int?>(sql, new { CourseId = courseId, StudentId = studentId });
        return result.HasValue;
    }

    public async Task<IReadOnlyList<Guid>> GetEnrolledStudentIdsAsync(Guid courseId)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT student_id FROM course_enrollments WHERE course_id = @CourseId";
        var result = await connection.QueryAsync<Guid>(sql, new { CourseId = courseId });
        return result.ToList();
    }
}
