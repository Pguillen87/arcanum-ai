const url = "https://giozhrukzcqoopssegby.supabase.co/functions/v1/whisper_processor";
const headers = {
  "Content-Type": "application/json",
  accept: "application/json",
  "x-edge-token": "srv-d8c6a6d2-4a34-4e8f-9b44-913f8d3b2509-prod"
};
const body = { transcriptionId: "93f3509f-a4a0-453d-9539-4be9d854b8a5" };

fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
  .then(async (resp) => {
    const text = await resp.text();
    console.log("status", resp.status);
    console.log(text);
  })
  .catch(console.error);
