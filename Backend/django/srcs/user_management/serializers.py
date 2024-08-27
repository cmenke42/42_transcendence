from rest_framework import serializers

class DynamicHyperlinkedModelSerializer(serializers.HyperlinkedModelSerializer):
    """
    A HyperlinkedModelSerializer that takes an additional `fields` argument that
    controls which fields will be displayed. Else the fields will remain 
    as defined in the Serializer.
    """

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        fields = kwargs.pop('fields', None)

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
