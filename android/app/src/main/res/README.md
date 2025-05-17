
# Android Resources Placeholder

You need to replace the default Capacitor icons with your own branded icons before publishing to the Play Store.

## Required Icon Replacements

Replace the following icon files with your own branded versions:

### Launcher Icons (mipmap folders)
- mipmap-hdpi/ic_launcher.png (72x72px)
- mipmap-mdpi/ic_launcher.png (48x48px)
- mipmap-xhdpi/ic_launcher.png (96x96px)
- mipmap-xxhdpi/ic_launcher.png (144x144px)
- mipmap-xxxhdpi/ic_launcher.png (192x192px)

### Adaptive Icons (Android 8.0+)
- mipmap-hdpi/ic_launcher_foreground.png
- mipmap-mdpi/ic_launcher_foreground.png
- mipmap-xhdpi/ic_launcher_foreground.png
- mipmap-xxhdpi/ic_launcher_foreground.png
- mipmap-xxxhdpi/ic_launcher_foreground.png

Update the background color in:
- values/ic_launcher_background.xml

### Notification Icons
- drawable-hdpi/ic_stat_ic_notification.png (white icon, 24x24px)
- drawable-mdpi/ic_stat_ic_notification.png (white icon, 24x24px)
- drawable-xhdpi/ic_stat_ic_notification.png (white icon, 24x24px)
- drawable-xxhdpi/ic_stat_ic_notification.png (white icon, 24x24px)
- drawable-xxxhdpi/ic_stat_ic_notification.png (white icon, 24x24px)

## Splash Screen
Update the splash screen image in:
- drawable/splash.png
