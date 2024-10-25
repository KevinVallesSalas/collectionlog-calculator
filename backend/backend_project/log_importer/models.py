from django.db import models

class Tab(models.Model):
    name = models.CharField(max_length=255)
    is_updated = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class LogEntry(models.Model):
    tab = models.ForeignKey(Tab, related_name='entries', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    is_updated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.tab.name} - {self.name}"

class Item(models.Model):
    log_entry = models.ForeignKey(LogEntry, related_name='items', on_delete=models.CASCADE)
    item_id = models.IntegerField()
    name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=0)
    obtained = models.BooleanField(default=False)
    sequence = models.IntegerField()

    def __str__(self):
        return f"{self.name} - {self.log_entry.name}"

class KillCount(models.Model):
    log_entry = models.ForeignKey(LogEntry, related_name='killcounts', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    amount = models.IntegerField(default=0)
    sequence = models.IntegerField()

    def __str__(self):
        return f"{self.name} - {self.amount} kills"

class CollectionLogItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    is_collected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.item.name} - {'Collected' if self.is_collected else 'Not Collected'}"
