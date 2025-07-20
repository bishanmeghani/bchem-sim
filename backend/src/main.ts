Deno.serve({ port: 8000 }, () => {
    return new Response("🧪 bchem-sim backend running...", {
        headers: {
            "Content-Type": "text/plain",
        },
    });
});
