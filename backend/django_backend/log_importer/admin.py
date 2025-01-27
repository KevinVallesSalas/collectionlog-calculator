from django.contrib import admin
from .models import Tab, LogEntry, Item, KillCount, CompletionRate, ActivityMap

admin.site.register(Tab)
admin.site.register(LogEntry)
admin.site.register(Item)
admin.site.register(KillCount)
admin.site.register(CompletionRate)
admin.site.register(ActivityMap)
