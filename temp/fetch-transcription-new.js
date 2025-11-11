const url = "https://giozhrukzcqoopssegby.supabase.co/rest/v1/transcriptions?select=*&id=eq.c3a5656f-cfed-04b1a-a4b8-9f77e0cad89c";
const headers = {
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpb3pocnVremNxb29wc3NlZ2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Njc1OTYsImV4cCI6MjA3ODA0MzU5Nn0.UEZHfi98pMz9QYp3uwLr3Yioe97YHGp03uu2GbtTwzM",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjZxQ3h2emYyZzc4TWR6TWoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2dpb3pocnVremNxb29wc3NlZ2J5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4ZTNhZmZmMC0yMzY0LTQyOTMtOGM0OS0yNmFkZTU1YmYxNTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyODIxMDYzLCJpYXQiOjE3NjI4MTc0NjMsImVtYWlsIjoicGd1aWx sZW41NTFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InBndWlsbGVuNTUxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJQYXVsbyAiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjhlM2FmZmYwLTIzNjQtNDI5My04YzQ5LTI2YWRlNTViZjE1MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYyNjA4NjUyfV0sInNlc3Npb25faWQiOiJlZGMwMjE2MC0yNTEzLTQ2OWMtYjRkYi1hZjMyZTA0NmY2M2IiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.Kov-1SDyG18jF064T1WUulq_DBCSktzoA6gOzEa8aVs",
  "Content-Type": "application/json",
  accept: "application/json",
  Prefer: "return=representation"
};

fetch(url, { headers })
  .then(async (resp) => {
    const body = await resp.text();
    console.log("status", resp.status);
    console.log(body);
  })
  .catch(console.error);
