const url = "https://giozhrukzcqoopssegby.supabase.co/rest/v1/rpc/retry_stale_transcriptions";
const headers = {
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpb3pocnVremNxb29wc3NlZ2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Njc1OTYsImV4cCI6MjA3ODA0MzU5Nn0.UEZHfi98pMz9QYp3uwLr3Yioe97YHGp03uu2GbtTwzM",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjZxQ3h2emYyZzc4TWR6TWoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2dpb3pocnVremNxb29wc3NlZ2J5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4ZTNhZmZmMC0yMzY0LTQyOTMtOGM0OS0yNmFkZTU1YmYxNTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyODE3NTM4LCJpYXQiOjE3NjI4MTM5MzgsImVtYWlsIjoicGd1aWxsZW41NTFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InBndWlsbGVuNTUxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJQYXVsbyAiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjhlM2FmZmYwLTIzNjQtNDI5My04YzQ5LTI2YWRlNTViZjE1MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYyNjA4NjUyfV0sInNlc3Npb25faWQiOiJlZGMwMjE2MC0yNTEzLTQ2OWMtYjRkYi1hZjMyZTA0NmY2M2IiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.8W3_M7BlsTS28W6A2IpmuxI0X5iKjgE0oH6GVJk8yT8",
  "Content-Type": "application/json",
  accept: "application/json",
  Prefer: "return=representation"
};

const payload = { cutoff: "0 minutes", max_attempts: 5 };

fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
  .then(async (resp) => {
    const body = await resp.text();
    console.log("status", resp.status);
    console.log(body);
  })
  .catch((err) => console.error(err));
