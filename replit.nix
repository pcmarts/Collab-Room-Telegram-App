{pkgs}: {
  deps = [
    pkgs.curl
    pkgs.lsof
    pkgs.glibcLocales
    pkgs.postgresql
  ];
}
