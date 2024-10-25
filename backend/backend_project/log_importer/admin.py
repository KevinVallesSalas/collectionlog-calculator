from django.contrib import admin
from .models import Tab, LogEntry, Item, KillCount

admin.site.register(Tab)
admin.site.register(LogEntry)
admin.site.register(Item)
admin.site.register(KillCount)
