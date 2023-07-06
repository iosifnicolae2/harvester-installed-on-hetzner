
export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url)
    const path = url.pathname;

    if(path.startsWith("/assets/")) {

      const assetFilename = path.replace("/assets/", "");
      console.log({assetFilename});

      const object = await env.BOOT_BUCKET.get(assetFilename, {
        range: request.headers,
        onlyIf: request.headers,
      });

      if (object === null) {
        throw new Error("Not found.");
      }
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      if (object.range) {
        headers.set("content-range", `bytes ${object.range.offset}-${object.range.end}/${object.size}`)
      }
      const status = object.body ? (request.headers.get("range") !== null ? 206 : 200) : 304
      return new Response(object.body, {
        headers,
        status
      })
    }

    const public_ip = request.headers.get('cf-connecting-ip');
    const internal_ip = path.split('/')[1];
    const mac_address = path.split('/')[2];
    const filename = path.split('/')[3];

    const objectName = `${public_ip}/${internal_ip}/${mac_address}/${filename}`;

    console.log({
          public_ip,
          internal_ip,
          mac_address,
          filename,
          method: request.method,
          url: request.url,
          path,
          objectName,
        },
    );

    const object = await env.BOOT_BUCKET.get(objectName, {
      range: request.headers,
      onlyIf: request.headers,
    })

    if (object === null) {
      throw new Error("Not found.");
    }

    await env.BOOT_BUCKET.delete(objectName);


    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    if (object.range) {
      headers.set("content-range", `bytes ${object.range.offset}-${object.range.end}/${object.size}`)
    }
    const status = object.body ? (request.headers.get("range") !== null ? 206 : 200) : 304
    return new Response(object.body, {
      headers,
      status
    })
  },
};