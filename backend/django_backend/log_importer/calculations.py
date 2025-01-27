from .models import ActivityMap, CompletionRate
from django.db.models import Sum, Min

def calculate_active_status(activity_index, item_id, user_data, requires_previous):
    """ Calculate if an item is active based on completion status and requirements. """
    completed = item_id in user_data['completed_items']
    previous_completed = user_data['completed_items'].get(item_id - 1, False) if requires_previous else True
    # Active if not completed and (previous is completed or requires_previous is False)
    return not completed and (previous_completed or not requires_previous)

def calculate_effective_droprate_neither(activity_index, user_data):
    # Calculate droprate excluding completed items
    neither_sum = (
        ActivityMap.objects.filter(completion_rate__activity_index=activity_index)
        .exclude(item_id__in=user_data['completed_items'])  # Exclude user-completed items
        .aggregate(total=Sum('neither_inverse'))
        .get('total')
    )
    return "n/a" if neither_sum is None or neither_sum == 0 else 1 / neither_sum

def calculate_effective_droprate_independent(activity_index, user_data):
    # Exclude items completed by the user
    independent_min = (
        ActivityMap.objects.filter(completion_rate__activity_index=activity_index)
        .exclude(item_id__in=user_data['completed_items'])  # Exclude user-completed items
        .aggregate(min_value=Min('drop_rate_attempts'))
        .get('min_value')
    )
    return "n/a" if independent_min is None else independent_min

def calculate_time_to_exact(activity_index, completions_per_hour, user_data):
    effective_droprate_exact = calculate_effective_droprate_neither(activity_index, user_data)
    if effective_droprate_exact == "n/a" or completions_per_hour == 0:
        return ""
    return effective_droprate_exact / completions_per_hour

def calculate_time_to_ei(activity_index, completions_per_hour, user_data):
    effective_droprate_ei = calculate_effective_droprate_independent(activity_index, user_data)
    if effective_droprate_ei == "n/a" or completions_per_hour == 0:
        return ""
    return effective_droprate_ei / completions_per_hour

def calculate_time_to_next_log_slot(activity_index, completions_per_hour, user_data):
    time_to_neither = calculate_effective_droprate_neither(activity_index, user_data)
    time_to_independent = calculate_effective_droprate_independent(activity_index, user_data)
    time_to_exact = calculate_time_to_exact(activity_index, completions_per_hour, user_data)
    time_to_ei = calculate_time_to_ei(activity_index, completions_per_hour, user_data)
    
    # Collect valid times while filtering out non-numeric values
    times = [time for time in [time_to_neither, time_to_independent, time_to_exact, time_to_ei] if isinstance(time, (int, float))]
    
    if any(time == 0 for time in times):
        return "Done!"
    
    min_time = min(times) if times else None
    return min_time / 24 if min_time is not None else "No available data"
