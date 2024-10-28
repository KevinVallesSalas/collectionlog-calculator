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
    index = models.IntegerField()  # Corresponds to "Activity index"
    activity_name = models.CharField(max_length=255)  # Corresponds to "Activity name"
    completions_per_hour_main = models.FloatField()  # "Completions/hr (main)"
    completions_per_hour_iron = models.FloatField()  # "Completions/hr (iron)"
    extra_time_to_first_completion = models.FloatField(default=0)  # "Extra time to first completion (hours)"
    notes = models.TextField(blank=True, null=True)  # "Notes"
    verification_source = models.CharField(max_length=255, blank=True, null=True)  # "Verification source"

    def __str__(self):
        return f"{self.activity_name} (Index: {self.index})"


class CompletionItem(models.Model):
    completion_rate = models.ForeignKey(CompletionRate, related_name='items', on_delete=models.CASCADE)
    item_id = models.IntegerField()  # "Item ID"
    item_name = models.CharField(max_length=255)  # "Item name"
    completed = models.BooleanField()  # "Completed"
    requires_previous = models.BooleanField()  # "Requires previous"
    active = models.BooleanField()  # "Active"
    exact = models.BooleanField()  # "Exact"
    independent = models.BooleanField()  # "Independent"
    drop_rate_attempts = models.FloatField()  # "Drop rate (attempts)"
    e_and_i = models.CharField(max_length=255, blank=True, null=True)  # "E&I"
    e_only = models.CharField(max_length=255, blank=True, null=True)  # "E"
    i_only = models.CharField(max_length=255, blank=True, null=True)  # "I"
    neither_inverse = models.FloatField(null=True, blank=True)  # "Neither^(-1)"

    def __str__(self):
        return f"{self.item_name} for {self.completion_rate.activity_name} (Item ID: {self.item_id})"