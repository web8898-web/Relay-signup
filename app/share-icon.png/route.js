const SHARE_ICON_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcElEQVR42u1ZQRKCMAy0HR6gn5Jfyeiv9FPyA705DAOYhASSsHsCpjDZbUiz7ekEAAAAAABwUJRoAZ+f98/4Wd92Jb0AU8Q1hKhZyHPGhRKAS4o7vmYiL3mviVi539fb7/ryeqz6Vo02+0PyU/fcLKhRZ57yPJ0AFoAAkYKdK3hrCqG7TpBSvCirALUrbCIR11r6XGWAtNnR8gQlE3GJISoWRJaCkBDv265YucFiOYPDgKTEXe4HWKWvBiFzASzJb0lcJICXwqUJlT5Aak/3JM7OAKo9pYjggbhKBizZ0ykRPBGHG4QACgJY2NOQyyB3FfBUC3btA0Itg17s6+4CZOsIzd2glgt05QYlAa0Vwt1+gGXmbPkbpdsS44qQclOUI4KbhoQjhOa5QLiDEY79pojgzgz1bVfmAsfpMOzwwQWwsN9uBZirA2OyaU6HNTIh3S8gNTmc99zXAK4I3PEhiiCVVAg3uJX9BgAAAAAA+IcvvsvWXuLm1qoAAAAASUVORK5CYII=";

export function GET() {
  const bytes = Uint8Array.from(Buffer.from(SHARE_ICON_BASE64, "base64"));
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
