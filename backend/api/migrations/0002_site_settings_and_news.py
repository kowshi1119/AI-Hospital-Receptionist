# Generated manually for SiteSettings and HospitalNews

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.IntegerField(default=1, editable=False, primary_key=True, serialize=False)),
                ('site_name', models.CharField(default='WeHealth', max_length=255)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='site/')),
                ('banner', models.ImageField(blank=True, null=True, upload_to='site/')),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'site_settings',
            },
        ),
        migrations.CreateModel(
            name='HospitalNews',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('posted_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='news_posts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'hospital_news',
                'ordering': ['-created_at'],
            },
        ),
    ]
