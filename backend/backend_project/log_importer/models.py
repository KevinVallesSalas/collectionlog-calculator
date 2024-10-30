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

class CompletionRate(models.Model):
    activity_index = models.IntegerField()
    activity_name = models.CharField(max_length=255)
    completions_per_hour_main = models.FloatField()
    completions_per_hour_iron = models.FloatField()
    extra_time_to_first_completion = models.FloatField(default=0)
    notes = models.TextField(blank=True, null=True)
    verification_source = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.activity_name} - (Index: {self.activity_index})"

class ActivityMap(models.Model):
    completion_rate = models.ForeignKey(CompletionRate, on_delete=models.CASCADE, related_name="activity_maps")
    activity_name = models.CharField(max_length=255)
    completions_per_hour = models.FloatField()
    additional_time_to_first_completion = models.FloatField(default=0)
    item_id = models.IntegerField()
    item_name = models.CharField(max_length=255)
    requires_previous = models.BooleanField()
    exact = models.BooleanField()
    independent = models.BooleanField()
    drop_rate_attempts = models.FloatField()
    e_and_i = models.CharField(max_length=255, blank=True, null=True)
    e_only = models.CharField(max_length=255, blank=True, null=True)
    i_only = models.CharField(max_length=255, blank=True, null=True)
    neither_inverse = models.FloatField(null=True, blank=True)
    sequence = models.IntegerField()

    def __str__(self):
        return f"{self.activity_name} - {self.item_name} (Item ID: {self.item_id})"
