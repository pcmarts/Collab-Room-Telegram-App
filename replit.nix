{pkgs}: {
  deps = [
    pkgs.openssh
    pkgs.lsof
    pkgs.glibcLocales
    pkgs.postgresql
  ];
}
