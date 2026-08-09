using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EduMatrix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StorageController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<StorageController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private const string BucketName = "edumatrix";

        public StorageController(IConfiguration configuration, ILogger<StorageController> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50MB limit
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var supabaseUrl = _configuration["Supabase:Url"];
            var serviceKey = _configuration["Supabase:ServiceRoleKey"];

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceKey))
            {
                _logger.LogError("Supabase configuration is missing.");
                return StatusCode(500, new { message = "Storage configuration error." });
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
                httpClient.DefaultRequestHeaders.Add("apikey", serviceKey);

                // Ensure bucket exists (best effort)
                var bucketPayload = new { id = BucketName, name = BucketName, @public = true };
                var bucketContent = new StringContent(JsonSerializer.Serialize(bucketPayload), Encoding.UTF8, "application/json");
                await httpClient.PostAsync($"{supabaseUrl}/storage/v1/bucket", bucketContent);

                // Generate unique filename
                var ext = Path.GetExtension(file.FileName);
                var uniqueName = $"{Guid.NewGuid()}{ext}";

                using var stream = file.OpenReadStream();
                using var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");

                var uploadResponse = await httpClient.PostAsync($"{supabaseUrl}/storage/v1/object/{BucketName}/{uniqueName}", fileContent);

                if (!uploadResponse.IsSuccessStatusCode)
                {
                    var errorDetails = await uploadResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Supabase Storage upload failed: {Error}", errorDetails);
                    return StatusCode(500, new { message = "Failed to upload file to storage." });
                }

                var publicUrl = $"{supabaseUrl}/storage/v1/object/public/{BucketName}/{uniqueName}";
                
                return Ok(new
                {
                    url = publicUrl,
                    fileName = file.FileName,
                    size = file.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file.");
                return StatusCode(500, new { message = "Internal server error during file upload." });
            }
        }
    }
}
