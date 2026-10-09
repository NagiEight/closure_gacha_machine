// shared/utils/http.util.ts

export async function checkResponseStatus(response: Response): Promise<void> {
  if (response.ok) return;

  try {
    const body = await response.json();
    if (typeof body.message === "string") {
      throw new Error(body.message);
    }
    if (Array.isArray(body.message)) {
      throw new Error(JSON.stringify(body.message));
    }
    throw new Error(`Request failed with status ${response.status}`);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error(`Request failed with status ${response.status}`);
  }
}
