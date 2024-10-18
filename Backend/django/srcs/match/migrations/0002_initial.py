# Generated by Django 5.0.6 on 2024-09-04 16:46

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('match', '0001_initial'),
        ('user_profile', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='match1v1',
            name='player_1',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_player_1_matches', to='user_profile.userprofile'),
        ),
        migrations.AddField(
            model_name='match1v1',
            name='player_2',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_player_2_matches', to='user_profile.userprofile'),
        ),
        migrations.AddField(
            model_name='match1v1',
            name='winner',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_won_matches', to='user_profile.userprofile'),
        ),
    ]