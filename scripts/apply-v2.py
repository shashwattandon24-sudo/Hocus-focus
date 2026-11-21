from pathlib import Path
import re
p = Path("app/src/main/assets/www/index.html")
source = p.read_text(encoding="utf-8")
enhancement = Path("hocus-v2-enhancements.js").read_text(encoding="utf-8")
assert "const hfCSS=" in enhancement
assert "function render(){" in source
assert "vOnb():vHome(anim)" in source
assert "it.doneAt=new Date().toISOString();" in source
assert source.count("\nrender();arm();") == 1
source = source.replace("vOnb():vHome(anim)", "vOnb():vEnhanced()")
source = source.replace("it.doneAt=new Date().toISOString();if(S.wins.day", "it.doneAt=new Date().toISOString();hfNextRepeat(it);if(S.wins.day")
source = source.replace("\nrender();arm();", "\n"+enhancement+"\napp.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;hfClick(e,b,b.dataset.a,b.dataset.id)},true);\nrender();arm();")
p.write_text(source,encoding="utf-8")
print("Hocus Focus v2 integrated:", len(source), "characters")

gradle=Path("app/build.gradle")
g=gradle.read_text()
assert "applicationId 'com.hocusfocus.app'" in g
g=g.replace("applicationId 'com.hocusfocus.app'", "applicationId 'com.hocusfocus.v2'")
g=g.replace("versionCode 1", "versionCode 2").replace("versionName '1.0.0'", "versionName '2.0.0'")
gradle.write_text(g)
manifest=Path("app/src/main/AndroidManifest.xml")
m=manifest.read_text()
assert 'android:label="Hocus Focus"' in m
manifest.write_text(m.replace('android:label="Hocus Focus"', 'android:label="Hocus Focus 2"'))
