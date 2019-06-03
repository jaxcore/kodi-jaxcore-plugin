# kodi-jaxcore-plugin


# Installing Kodi Plugin for OSMC (Raspberry Pi 3)

First enable Bluetooth:

```
sudo nano /var/lib/connman/settings
```

Find the Bluetooth settings:
```
[Bluetooth]
Enable=false
Tethering=false
```

Change Bluetooth to `true`:

```
[Bluetooth]
Enable=true
Tethering=false
```

Ctrl-X to save and exit, reboot OSMC.
