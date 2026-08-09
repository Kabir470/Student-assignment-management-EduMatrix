using System.Collections.Generic;

namespace EduMatrix.Domain.Common;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? ErrorMessage { get; }
    public IReadOnlyList<string>? Errors { get; }

    private Result(bool isSuccess, T? value, string? errorMessage, IReadOnlyList<string>? errors = null)
    {
        IsSuccess = isSuccess;
        Value = value;
        ErrorMessage = errorMessage;
        Errors = errors;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string errorMessage, IReadOnlyList<string>? errors = null) => new(false, default, errorMessage, errors);
}

public class Result
{
    public bool IsSuccess { get; }
    public string? ErrorMessage { get; }
    public IReadOnlyList<string>? Errors { get; }

    private Result(bool isSuccess, string? errorMessage, IReadOnlyList<string>? errors = null)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        Errors = errors;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(string errorMessage, IReadOnlyList<string>? errors = null) => new(false, errorMessage, errors);
}
